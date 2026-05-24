"""认证服务 - 对应 Go 版 usecase/auth.go + auth_github.go"""

from sqlalchemy.ext.asyncio import AsyncSession


class AuthService:
    """认证业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_auth(self, kb_id: str, source_type: str) -> dict:
        """获取认证配置"""
        # TODO: 实现
        return {}

    async def set_auth(self, req) -> None:
        """设置认证配置"""
        # TODO: 实现
        pass

    async def delete_auth(self, req) -> None:
        """删除认证配置"""
        # TODO: 实现
        pass

    async def get_share_auth(self, kb_id: str) -> dict:
        """获取前台认证信息"""
        # TODO: 实现
        return {}

    async def login_simple(self, req: dict) -> dict:
        """简单口令登录"""
        # TODO: 实现
        return {}

    async def login_github(self, req: dict) -> dict:
        """GitHub OAuth登录"""
        # TODO: 实现
        return {}

    async def github_callback(self, code: str, state: str) -> dict:
        """GitHub OAuth回调"""
        # TODO: 实现
        return {}
