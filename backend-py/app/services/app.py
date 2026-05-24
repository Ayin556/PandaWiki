"""应用服务 - 对应 Go 版 usecase/app.go"""

from sqlalchemy.ext.asyncio import AsyncSession


class AppService:
    """应用业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_app_detail(self, kb_id: str, app_id: str) -> dict:
        """获取应用详情"""
        # TODO: 实现
        return {}

    async def update_app(self, req: dict) -> None:
        """更新应用配置"""
        # TODO: 实现
        pass

    async def delete_app(self, app_id: str, kb_id: str) -> None:
        """删除应用"""
        # TODO: 实现
        pass

    async def get_web_app_info(self, kb_id: str) -> dict:
        """获取Web应用信息"""
        # TODO: 实现
        return {}

    async def get_widget_app_info(self, kb_id: str) -> dict:
        """获取Widget应用信息"""
        # TODO: 实现
        return {}

    async def get_wechat_app_info(self, kb_id: str) -> dict:
        """获取微信应用信息"""
        # TODO: 实现
        return {}
