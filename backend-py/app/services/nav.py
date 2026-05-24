"""栏目服务 - 对应 Go 版 usecase/nav.go"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.nav import NavRepository


class NavService:
    """栏目业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NavRepository(db)

    async def get_list(self, kb_id: str) -> list:
        """获取栏目列表"""
        return await self.repo.get_list(kb_id)

    async def get_release_list(self, kb_id: str) -> list:
        """获取已发布栏目列表"""
        return await self.repo.get_release_list(kb_id)

    async def add(self, req) -> None:
        """添加栏目"""
        await self.repo.add(req)

    async def move(self, req) -> None:
        """移动栏目"""
        await self.repo.move(req)

    async def delete(self, kb_id: str, nav_id: str) -> None:
        """删除栏目"""
        await self.repo.delete(kb_id, nav_id)

    async def update(self, req) -> None:
        """更新栏目"""
        await self.repo.update(req)
