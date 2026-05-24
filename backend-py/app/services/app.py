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
        """获取应用详情 - 对应 Go 版 GetAppDetailByKBIDAndAppType"""
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
        """获取Web应用信息 - 对应 Go 版 ShareGetWebAppInfo"""
        app = await self.repo.get_or_create_by_kb_id_and_type(kb_id, 1)  # Web type
        settings = app.settings or {}

        # 获取知识库信息
        from app.models.knowledge_base import KnowledgeBase
        from sqlalchemy import select
        result = await self.db.execute(
            select(KnowledgeBase).where(KnowledgeBase.id == kb_id)
        )
        kb = result.scalar_one_or_none()

        return {
            "kb_id": kb_id,
            "title": settings.get("title", kb.name if kb else ""),
            "icon": settings.get("icon", ""),
            "description": settings.get("description", ""),
            "theme": settings.get("theme", {"primary_color": "#1890ff", "mode": "light"}),
            "watermark": settings.get("watermark", {"setting": "hidden", "text": ""}),
            "copy_setting": settings.get("copy_setting", {"setting": "none", "text": ""}),
            "chat": settings.get("chat", {"enabled": True, "show_source": True}),
            "welcome": settings.get("welcome", {"enabled": True, "message": ""}),
            "landing_page": settings.get("landing_page", {"enabled": False, "nav_id": ""}),
            "recommend_nodes": settings.get("recommend_nodes", {"type": "nav", "nav_ids": [], "node_ids": []}),
            "feedback": settings.get("feedback", {"enabled": False}),
            "comment": settings.get("comment", {"enabled": False, "review_enabled": False}),
            "copyright": settings.get("copyright", {"enabled": False, "content": ""}),
            "disclaimer": settings.get("disclaimer", {"enabled": False, "content": ""}),
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
