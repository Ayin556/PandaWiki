"""用户仓储 - 对应 Go 版 repo/pg/user.go"""

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, KBUser
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """用户数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_account(self, account: str) -> User | None:
        """根据账号获取用户"""
        result = await self.db.execute(select(User).where(User.account == account))
        return result.scalar_one_or_none()

    async def list_all(self) -> list[User]:
        """获取所有用户"""
        result = await self.db.execute(select(User).order_by(User.created_at.desc()))
        return list(result.scalars().all())

    async def update_password(self, user_id: str, hashed_password: str) -> None:
        """更新密码"""
        await self.update_by_id(user_id, {"password": hashed_password})

    async def delete(self, user_id: str) -> None:
        """删除用户(同时删除 kb_users)"""
        await self.db.execute(delete(KBUser).where(KBUser.user_id == user_id))
        await self.delete_by_id(user_id)

    async def get_kb_perm(self, kb_id: str, user_id: str) -> str:
        """获取用户对知识库的权限"""
        result = await self.db.execute(
            select(KBUser.perm).where(KBUser.kb_id == kb_id, KBUser.user_id == user_id)
        )
        row = result.scalar_one_or_none()
        return row if row else ""
