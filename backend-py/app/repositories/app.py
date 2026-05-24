"""应用仓储 - 对应 Go 版 repo/pg/app.go"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app import App
from app.repositories.base import BaseRepository


class AppRepository(BaseRepository[App]):
    """应用数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(App, db)

    async def get_by_kb_id_and_type(self, kb_id: str, app_type: int) -> Optional[App]:
        """根据知识库ID和应用类型获取应用"""
        result = await self.db.execute(
            select(App).where(App.kb_id == kb_id, App.type == app_type)
        )
        return result.scalar_one_or_none()

    async def get_or_create_by_kb_id_and_type(self, kb_id: str, app_type: int) -> App:
        """获取或创建应用"""
        app = await self.get_by_kb_id_and_type(kb_id, app_type)
        if app:
            return app
        # 自动创建
        app = App(kb_id=kb_id, type=app_type, settings=self._default_settings(app_type))
        self.db.add(app)
        await self.db.commit()
        await self.db.refresh(app)
        return app

    async def get_list_by_kb_id(self, kb_id: str) -> list[App]:
        """获取知识库下所有应用"""
        result = await self.db.execute(
            select(App).where(App.kb_id == kb_id)
        )
        return list(result.scalars().all())

    @staticmethod
    def _default_settings(app_type: int) -> dict:
        """获取应用类型默认设置"""
        base = {
            "title": "",
            "icon": "",
            "description": "",
            "desc": "",
            "keyword": "",
            "contribute_settings": {"is_enable": False},
            "theme_mode": "light",
            "theme_and_style": {},
            "watermark_setting": "hidden",
            "watermark_content": "",
            "copy_setting": {"setting": "none", "text": ""},
            "chat": {"enabled": True, "show_source": True},
            "welcome": {"enabled": True, "message": ""},
            "feedback": {"enabled": False},
            "comment": {"enabled": False, "review_enabled": False},
            "copyright": {"enabled": False, "content": ""},
            "disclaimer": {"enabled": False, "content": ""},
            "home_page_setting": "doc",
            "conversation_setting": {},
            "stats_setting": {},
            "catalog_settings": {},
            "footer_settings": {},
            "web_app_comment_settings": {},
            "disclaimer_settings": {"content": "本回答由 PandaWiki 基于 AI 生成，仅供参考。"},
            "ai_feedback_settings": {"ai_feedback_type": ["内容不准确", "没有帮助", "其他"]},
        }
        if app_type == 1:  # Web
            base["landing_page"] = {"enabled": False, "nav_id": ""}
            base["recommend_nodes"] = {"type": "nav", "nav_ids": [], "node_ids": []}
        return base
