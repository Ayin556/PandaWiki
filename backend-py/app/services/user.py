"""用户服务 - 对应 Go 版 usecase/user.go"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password, get_password_hash
from app.models.user import User
from app.repositories.user import UserRepository


class UserService:
    """用户业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)

    async def verify_user(self, account: str, password: str) -> User | None:
        """验证用户凭据"""
        user = await self.repo.get_by_account(account)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user

    async def create_user(self, req) -> User:
        """创建用户"""
        user = User(
            account=req.account,
            password=get_password_hash(req.password),
            role=req.role,
        )
        return await self.repo.create(user)

    async def get_user(self, user_id: str) -> User | None:
        """获取用户"""
        return await self.repo.get_by_id(user_id)

    async def list_users(self) -> list[User]:
        """获取用户列表"""
        return await self.repo.list_all()

    async def reset_password(self, user_id: str, new_password: str) -> None:
        """重置密码"""
        await self.repo.update_password(user_id, get_password_hash(new_password))

    async def delete_user(self, user_id: str) -> None:
        """删除用户"""
        await self.repo.delete(user_id)
