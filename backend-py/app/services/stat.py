"""统计服务 - 对应 Go 版 usecase/stat.go"""

from datetime import datetime, timedelta, timezone

from loguru import logger
from sqlalchemy import select, func, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.stat import StatPage, StatPageHour, NodeStats
from app.models.conversation import Conversation
from app.models.node import Node
from app.models.app import App
from app.repositories.stat import StatRepository


class StatService:
    """统计分析业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = StatRepository(db)

    async def record_page(self, req: dict) -> None:
        """记录页面访问 - 对应 Go 版 RecordPage"""
        stat = StatPage(
            kb_id=req.get("kb_id", ""),
            node_id=req.get("node_id", ""),
            scene=req.get("scene", 0),
            session_id=req.get("session_id", ""),
            ip=req.get("ip", ""),
            ua=req.get("ua", ""),
            browser_name=self._parse_browser(req.get("ua", "")),
            browser_os=self._parse_os(req.get("ua", "")),
            referer=req.get("referer", ""),
            referer_host=self._extract_host(req.get("referer", "")),
        )
        self.db.add(stat)
        await self.db.commit()

        # 异步更新 IP 地理位置 Redis 缓存
        ip = req.get("ip", "")
        if ip:
            try:
                from app.infrastructure.ipdb import get_ip_location
                location = get_ip_location(ip)
                if location:
                    redis = await self._get_redis()
                    if redis:
                        await redis.set(f"geo:{ip}", location, ex=86400)
            except Exception as e:
                logger.debug(f"Geo lookup failed for {ip}: {e}")

    async def get_instant_count(self, kb_id: str) -> dict:
        """实时访问计数 - 对应 Go 版 GetInstantCount"""
        redis = await self._get_redis()
        if not redis:
            return {"online_count": 0}
        # 统计最近 5 分钟活跃 session
        count = await redis.scard(f"online:{kb_id}")
        return {"online_count": count}

    async def get_instant_pages(self, kb_id: str) -> list:
        """实时热门页面 - 对应 Go 版 GetInstantPages"""
        # 从最近 5 分钟的 stat_page 记录获取
        five_min_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
        result = await self.db.execute(
            select(StatPage)
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= five_min_ago)
            .order_by(StatPage.created_at.desc())
            .limit(50)
        )
        pages = list(result.scalars().all())

        # 批量查询节点名称
        node_ids = set(p.node_id for p in pages if p.node_id)
        node_name_map = {}
        if node_ids:
            node_result = await self.db.execute(
                select(Node.id, Node.name).where(Node.id.in_(node_ids))
            )
            for nid, nname in node_result.all():
                node_name_map[nid] = nname

        # 补充地理位置和场景名称
        items = []
        for p in pages:
            # 解析 IP 地理位置
            country = ""
            province = ""
            city = ""
            if p.ip:
                try:
                    redis = await self._get_redis()
                    if redis:
                        location = await redis.get(f"geo:{p.ip}") or ""
                        if location and "|" in location:
                            parts = location.split("|")
                            country = parts[0] if len(parts) > 0 else ""
                            province = parts[1] if len(parts) > 1 else ""
                            city = parts[2] if len(parts) > 2 else ""
                except Exception:
                    pass

            items.append({
                "scene": p.scene,
                "node_id": p.node_id,
                "node_name": node_name_map.get(p.node_id, ""),
                "ip": p.ip,
                "ip_address": {
                    "ip": p.ip,
                    "country": country,
                    "province": province,
                    "city": city,
                },
                "info": None,
                "user_id": p.user_id if hasattr(p, 'user_id') else 0,
                "created_at": p.created_at.isoformat() if p.created_at else "",
            })
        return items

    async def get_stat_count(self, kb_id: str, day: int = 1) -> dict:
        """全局统计 - 对应 Go 版 GetStatCount"""
        since = datetime.now(timezone.utc) - timedelta(days=day)

        # 统一从明细表查询（Python 版无消费者聚合 stat_page_hours）
        pv_result = await self.db.execute(
            select(func.count()).select_from(StatPage)
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= since)
        )
        uv_result = await self.db.execute(
            select(func.count(func.distinct(StatPage.ip)))
            .select_from(StatPage)
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= since)
        )
        session_result = await self.db.execute(
            select(func.count(func.distinct(StatPage.session_id)))
            .select_from(StatPage)
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= since)
        )
        conv_result = await self.db.execute(
            select(func.count()).select_from(Conversation)
            .where(Conversation.kb_id == kb_id, Conversation.created_at >= since)
        )
        return {
            "page_visit_count": pv_result.scalar_one(),
            "ip_count": uv_result.scalar_one(),
            "session_count": session_result.scalar_one(),
            "conversation_count": conv_result.scalar_one(),
        }

    async def get_geo_count(self, kb_id: str, day: int = 1) -> list:
        """地理分布 - 对应 Go 版 GetGeoCount"""
        redis = await self._get_redis()
        if not redis:
            return []

        # 从 Redis 获取最近访问的 IP 地理位置
        keys = await redis.keys(f"geo:*")
        geo_map = {}
        for key in keys:
            location = await redis.get(key)
            if location and "|" in location:
                parts = location.split("|")
                city = parts[-1] if parts[-1] else parts[-2]
                geo_map[city] = geo_map.get(city, 0) + 1

        return [{"city": k, "count": v} for k, v in sorted(geo_map.items(), key=lambda x: -x[1])[:20]]

    async def get_conversation_distribution(self, kb_id: str, day: int = 1) -> list:
        """问答来源分布 - 对应 Go 版 GetConversationDistribution"""
        since = datetime.now(timezone.utc) - timedelta(days=day)

        result = await self.db.execute(
            select(Conversation.app_id, func.count())
            .where(Conversation.kb_id == kb_id, Conversation.created_at >= since)
            .group_by(Conversation.app_id)
        )
        dist = {}
        for app_id, count in result.all():
            # 查询 app 类型
            if app_id:
                app_result = await self.db.execute(
                    select(App.type).where(App.id == app_id)
                )
                app_type = app_result.scalar_one_or_none()
                dist[app_type or 0] = dist.get(app_type or 0, 0) + count
            else:
                dist[0] = dist.get(0, 0) + count

        return [{"app_type": k, "count": v} for k, v in dist.items()]

    async def get_hot_pages(self, kb_id: str, day: int = 1) -> list:
        """热门文档 - 对应 Go 版 GetHotPages"""
        since = datetime.now(timezone.utc) - timedelta(days=day)

        # 统一从明细表查询（Python 版无消费者聚合 stat_page_hours）
        result = await self.db.execute(
            select(StatPage.node_id, func.count().label("count"))
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= since, StatPage.node_id != "")
            .group_by(StatPage.node_id)
            .order_by(func.count().desc())
            .limit(10)
        )

        items = []
        for node_id, count in result.all():
            node_result = await self.db.execute(
                select(Node.name).where(Node.id == node_id)
            )
            name = node_result.scalar_one_or_none() or ""
            items.append({"node_id": node_id, "node_name": name, "count": count})
        return items

    async def get_hot_referer_hosts(self, kb_id: str, day: int = 1) -> list:
        """来源域名统计 - 对应 Go 版 GetHotRefererHosts"""
        since = datetime.now(timezone.utc) - timedelta(days=day)

        result = await self.db.execute(
            select(StatPage.referer_host, func.count().label("count"))
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= since, StatPage.referer_host != "")
            .group_by(StatPage.referer_host)
            .order_by(func.count().desc())
            .limit(10)
        )
        return [{"referer_host": host, "count": count} for host, count in result.all()]

    async def get_hot_browsers(self, kb_id: str, day: int = 1) -> dict:
        """浏览器统计 - 对应 Go 版 GetHotBrowsers"""
        since = datetime.now(timezone.utc) - timedelta(days=day)

        result = await self.db.execute(
            select(StatPage.browser_name, func.count().label("count"))
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= since, StatPage.browser_name != "")
            .group_by(StatPage.browser_name)
            .order_by(func.count().desc())
            .limit(10)
        )
        browser_list = [{"name": name, "count": count} for name, count in result.all()]

        # 操作系统统计
        os_result = await self.db.execute(
            select(StatPage.browser_os, func.count().label("count"))
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= since, StatPage.browser_os != "")
            .group_by(StatPage.browser_os)
            .order_by(func.count().desc())
            .limit(10)
        )
        os_list = [{"name": name, "count": count} for name, count in os_result.all()]

        return {"browser": browser_list, "os": os_list}

    async def _get_redis(self):
        """获取 Redis 连接"""
        try:
            from app.infrastructure.redis import get_redis
            return await get_redis()
        except Exception:
            return None

    @staticmethod
    def _scene_name(scene: int) -> str:
        """场景码转中文名"""
        return {1: "欢迎页", 2: "节点详情", 3: "问答页", 4: "登录页"}.get(scene, "未知")

    @staticmethod
    def _parse_browser(ua: str) -> str:
        """从 User-Agent 解析浏览器名"""
        if not ua:
            return ""
        ua_lower = ua.lower()
        if "edg" in ua_lower:
            return "Edge"
        if "chrome" in ua_lower:
            return "Chrome"
        if "firefox" in ua_lower:
            return "Firefox"
        if "safari" in ua_lower:
            return "Safari"
        if "opera" in ua_lower or "opr" in ua_lower:
            return "Opera"
        return "Other"

    @staticmethod
    def _parse_os(ua: str) -> str:
        """从 User-Agent 解析操作系统"""
        if not ua:
            return ""
        ua_lower = ua.lower()
        if "windows" in ua_lower:
            return "Windows"
        if "mac" in ua_lower:
            return "macOS"
        if "linux" in ua_lower:
            return "Linux"
        if "android" in ua_lower:
            return "Android"
        if "iphone" in ua_lower or "ipad" in ua_lower:
            return "iOS"
        return "Other"

    @staticmethod
    def _extract_host(url: str) -> str:
        """从 URL 提取域名"""
        if not url:
            return ""
        try:
            from urllib.parse import urlparse
            return urlparse(url).hostname or ""
        except Exception:
            return ""
