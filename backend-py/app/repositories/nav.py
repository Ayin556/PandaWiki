"""栏目仓储 - 对应 Go 版 repo/pg/nav.go"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.nav import Nav
from app.repositories.base import BaseRepository


class NavRepository(BaseRepository[Nav]):
    """栏目数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(Nav, db)

    async def get_list(self, kb_id: str) -> list[Nav]:
        """获取栏目列表"""
        result = await self.db.execute(
            select(Nav).where(Nav.kb_id == kb_id).order_by(Nav.position)
        )
        return list(result.scalars().all())

    async def add(self, req) -> None:
        """添加栏目"""
        nav = Nav(kb_id=req.kb_id, name=req.name, position=0.0)
        self.db.add(nav)
        await self.db.commit()

    async def delete(self, kb_id: str, nav_id: str) -> None:
        """删除栏目"""
        await self.delete_by_id(nav_id)

    async def update(self, req) -> None:
        """更新栏目"""
        await self.update_by_id(req.id, {"name": req.name})

    async def move(self, req) -> None:
        """移动栏目排序"""
        await self.update_by_id(req.id, {"position": 0.0})

    async def get_release_list(self, kb_id: str) -> list:
        """获取已发布栏目列表"""
        # TODO: 实现发布版本查询
        return await self.get_list(kb_id)
