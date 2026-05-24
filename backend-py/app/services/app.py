"""应用服务 - 对应 Go 版 usecase/app.go"""

from typing import Optional

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app import App
from app.repositories.app import AppRepository


class AppService:
    """应用业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AppRepository(db)

    async def get_app_detail(self, kb_id: str, app_id: str) -> dict:
        """获取应用详情（按 ID）"""
        app = await self.repo.get_by_id(app_id)
        if not app or app.kb_id != kb_id:
            return {}

        settings = app.settings or {}
        return {
            "id": app.id,
            "kb_id": app.kb_id,
            "name": app.name,
            "type": app.type,
            "settings": settings,
        }

    async def get_app_detail_by_type(self, kb_id: str, app_type: str) -> dict:
        """获取应用详情 - 对应 Go 版 GetAppDetailByKBIDAndAppType，按 kb_id + type 查询"""
        try:
            type_int = int(app_type)
        except (ValueError, TypeError):
            return {}

        app = await self.repo.get_by_kb_id_and_type(kb_id, type_int)
        if not app:
            # 如果不存在，自动创建（与 Go 版行为一致）
            app = await self.repo.get_or_create_by_kb_id_and_type(kb_id, type_int)

        settings = app.settings or {}
        return {
            "id": app.id,
            "kb_id": app.kb_id,
            "name": app.name,
            "type": app.type,
            "settings": settings,
        }

    async def update_app(self, req: dict) -> None:
        """更新应用配置 - 对应 Go 版 UpdateApp"""
        app_id = req.get("id", "")
        kb_id = req.get("kb_id", "")

        app = await self.repo.get_by_id(app_id)
        if not app or app.kb_id != kb_id:
            return

        data = {}
        if "name" in req:
            data["name"] = req["name"]
        if "settings" in req:
            # 合并 settings
            current_settings = app.settings or {}
            new_settings = req["settings"]
            merged = {**current_settings, **new_settings}
            data["settings"] = merged

        if data:
            await self.repo.update_by_id(app_id, data)

    async def delete_app(self, app_id: str, kb_id: str) -> None:
        """删除应用 - 对应 Go 版 DeleteApp"""
        app = await self.repo.get_by_id(app_id)
        if app and app.kb_id == kb_id:
            await self.repo.delete_by_id(app_id)

    async def get_web_app_info(self, kb_id: str) -> dict:
        """获取Web应用信息 - 对应 Go 版 ShareGetWebAppInfo
        返回结构与 Go 版 AppInfoResp 一致: {name, settings, base_url}
        """
        app = await self.repo.get_or_create_by_kb_id_and_type(kb_id, 1)  # Web type
        settings = app.settings or {}

        # 获取知识库信息
        from app.models.knowledge_base import KnowledgeBase
        from sqlalchemy import select
        result = await self.db.execute(
            select(KnowledgeBase).where(KnowledgeBase.id == kb_id)
        )
        kb = result.scalar_one_or_none()

        # 获取 base_url: Go 版从 kb.AccessSettings.BaseURL 读取
        access_settings = kb.access_settings or {} if kb else {}
        base_url = access_settings.get("base_url", "")

        # 直接透传数据库中的 settings JSONB，以 Go 版 AppSettingsResp 为准
        # 数据库存的就是完整的 Go 版 AppSettings JSON，无需逐字段映射
        return {
            "name": app.name or "",
            "settings": settings,
            "base_url": base_url,
        }

    async def get_widget_app_info(self, kb_id: str) -> dict:
        """获取Widget应用信息 - 对应 Go 版 GetWidgetAppInfo"""
        # 合并 WebApp 和 WidgetApp 的信息
        web_app = await self.repo.get_or_create_by_kb_id_and_type(kb_id, 1)
        widget_app = await self.repo.get_or_create_by_kb_id_and_type(kb_id, 2)

        web_settings = web_app.settings or {}
        widget_settings = widget_app.settings or {}

        return {
            "kb_id": kb_id,
            "title": web_settings.get("title", ""),
            "icon": web_settings.get("icon", ""),
            "chat": widget_settings.get("chat", web_settings.get("chat", {"enabled": True})),
            "welcome": widget_settings.get("welcome", web_settings.get("welcome", {"enabled": True})),
            "recommend_nodes": widget_settings.get("recommend_nodes", {"type": "nav", "nav_ids": [], "node_ids": []}),
        }

    async def get_wechat_app_info(self, kb_id: str) -> dict:
        """获取微信应用信息 - 对应 Go 版 GetWechatAppInfo"""
        app = await self.repo.get_by_kb_id_and_type(kb_id, 5)  # WeChat type
        if not app:
            return {"kb_id": kb_id, "enabled": False}
        settings = app.settings or {}
        return {
            "kb_id": kb_id,
            "enabled": settings.get("enabled", False),
        }
