"""栏目仓储 - 对应 Go 版 repo/pg/nav.go"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.nav import Nav, NavRelease
from app.models.node import Node
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
        """添加栏目 - 自动计算 position"""
        # 获取当前最大 position
        max_result = await self.db.execute(
            select(func.max(Nav.position)).where(Nav.kb_id == req.kb_id)
        )
        max_pos = max_result.scalar_one_or_none() or 0

        nav = Nav(
            kb_id=req.kb_id,
            name=req.name,
            position=req.position if req.position is not None else max_pos + 1000,
        )
        self.db.add(nav)
        await self.db.commit()

    async def delete(self, kb_id: str, nav_id: str) -> None:
        """删除栏目"""
        await self.delete_by_id(nav_id)

    async def update(self, req) -> None:
        """更新栏目"""
        data = {"name": req.name}
        await self.update_by_id(req.id, data)

    async def move(self, req) -> None:
        """移动栏目排序 - 根据 prev_id 和 next_id 计算中间位置"""
        prev_pos = 0.0
        next_pos = 0.0

        if req.prev_id:
            prev = await self.get_by_id(req.prev_id)
            prev_pos = prev.position if prev else 0.0

        if req.next_id:
            nxt = await self.get_by_id(req.next_id)
            next_pos = nxt.position if nxt else 0.0

        # 计算中间位置
        if prev_pos and next_pos:
            new_pos = (prev_pos + next_pos) / 2
        elif prev_pos:
            new_pos = prev_pos + 1000
        elif next_pos:
            new_pos = next_pos / 2
        else:
            new_pos = 1000

        await self.update_by_id(req.id, {"position": new_pos})

    async def get_release_list(self, kb_id: str) -> list:
        """获取已发布栏目列表 - 包含每个栏目下的已发布节点数"""
        navs = await self.get_list(kb_id)
        result_list = []

        for nav in navs:
            # 统计已发布节点数
            count_result = await self.db.execute(
                select(func.count()).select_from(Node)
                .where(Node.kb_id == kb_id, Node.nav_id == nav.id, Node.status == 2)
            )
            node_count = count_result.scalar_one()

            result_list.append({
                "id": nav.id,
                "name": nav.name,
                "kb_id": nav.kb_id,
                "position": nav.position,
                "node_count": node_count,
            })

        return result_list
