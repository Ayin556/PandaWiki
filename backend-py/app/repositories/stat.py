"""统计仓储 - 对应 Go 版 repo/pg/stat.go"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.stat import StatPage, StatPageHour, NodeStats
from app.models.conversation import Conversation
from app.repositories.base import BaseRepository


class StatRepository(BaseRepository[StatPage]):
    """统计数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(StatPage, db)

    async def get_pv_count(self, kb_id: str, since: datetime) -> int:
        """获取 PV 数"""
        result = await self.db.execute(
            select(func.count()).select_from(StatPage)
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= since)
        )
        return result.scalar_one()

    async def get_uv_count(self, kb_id: str, since: datetime) -> int:
        """获取 UV 数"""
        result = await self.db.execute(
            select(func.count(func.distinct(StatPage.ip)))
            .select_from(StatPage)
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= since)
        )
        return result.scalar_one()

    async def get_session_count(self, kb_id: str, since: datetime) -> int:
        """获取 session 数"""
        result = await self.db.execute(
            select(func.count(func.distinct(StatPage.session_id)))
            .select_from(StatPage)
            .where(StatPage.kb_id == kb_id, StatPage.created_at >= since)
        )
        return result.scalar_one()

    async def get_conversation_count(self, kb_id: str, since: datetime) -> int:
        """获取对话数"""
        result = await self.db.execute(
            select(func.count()).select_from(Conversation)
            .where(Conversation.kb_id == kb_id, Conversation.created_at >= since)
        )
        return result.scalar_one()

    async def get_hourly_stats(self, kb_id: str, since: datetime) -> list[StatPageHour]:
        """获取小时聚合数据"""
        result = await self.db.execute(
            select(StatPageHour)
            .where(StatPageHour.kb_id == kb_id, StatPageHour.hour >= since)
        )
        return list(result.scalars().all())

    async def check_hour_exists(self, kb_id: str, hour: datetime) -> bool:
        """检查小时数据是否已聚合"""
        result = await self.db.execute(
            select(func.count()).select_from(StatPageHour)
            .where(StatPageHour.kb_id == kb_id, StatPageHour.hour == hour)
        )
        return result.scalar_one() > 0

    async def aggregate_hourly(self, kb_id: str, hour: datetime, data: dict) -> None:
        """聚合小时数据"""
        stat = StatPageHour(
            kb_id=kb_id,
            hour=hour,
            ip_count=data.get("ip_count", 0),
            session_count=data.get("session_count", 0),
            page_visit_count=data.get("page_visit_count", 0),
            conversation_count=data.get("conversation_count", 0),
            geo_count=data.get("geo_count", {}),
            conversation_distribution=data.get("conversation_distribution", {}),
            hot_referer_host=data.get("hot_referer_host", {}),
            hot_page=data.get("hot_page", {}),
            hot_browser=data.get("hot_browser", {}),
            hot_os=data.get("hot_os", {}),
        )
        self.db.add(stat)
        await self.db.commit()

    async def cleanup_old_hourly(self, days: int = 90) -> int:
        """清理旧的小时统计数据"""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        result = await self.db.execute(
            sa_delete(StatPageHour).where(StatPageHour.hour < cutoff)
        )
        await self.db.commit()
        return result.rowcount

    async def upsert_node_stats(self, node_id: str, pv: int) -> None:
        """Upsert 节点 PV 统计"""
        result = await self.db.execute(
            select(NodeStats).where(NodeStats.node_id == node_id)
        )
        stats = result.scalar_one_or_none()
        if stats:
            stats.pv = pv
        else:
            stats = NodeStats(node_id=node_id, pv=pv)
            self.db.add(stats)
        await self.db.commit()
