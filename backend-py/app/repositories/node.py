"""节点仓储 - 对应 Go 版 repo/pg/node.go"""

from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node import Node, NodeRelease, NodeAuthGroup
from app.repositories.base import BaseRepository


class NodeRepository(BaseRepository[Node]):
    """节点数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(Node, db)

    async def create(self, req, user_id: str) -> str:
        """创建节点"""
        node = Node(
            kb_id=req.kb_id,
            nav_id=req.nav_id,
            name=req.name,
            content=req.content,
            type=req.type,
            parent_id=req.parent_id,
            creator_id=user_id,
            editor_id=user_id,
        )
        self.db.add(node)
        await self.db.commit()
        await self.db.refresh(node)
        return node.id

    async def get_list(self, kb_id: str, nav_id: str = "", search: str = "") -> list:
        """获取节点列表"""
        query = select(Node).where(Node.kb_id == kb_id)
        if nav_id:
            query = query.where(Node.nav_id == nav_id)
        if search:
            query = query.where(Node.name.ilike(f"%{search}%"))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_list_group_by_nav(self, kb_id: str, search: str = "") -> dict:
        """按栏目分组获取节点"""
        nodes = await self.get_list(kb_id, search=search)
        # TODO: 按栏目分组
        return {"list": []}

    async def get_detail(self, kb_id: str, node_id: str, format: str = "markdown") -> Optional[dict]:
        """获取节点详情"""
        result = await self.db.execute(
            select(Node).where(Node.id == node_id, Node.kb_id == kb_id)
        )
        node = result.scalar_one_or_none()
        if not node:
            return None
        # TODO: 格式转换、附加发布者信息
        return node

    async def update(self, req, user_id: str) -> None:
        """更新节点"""
        data = {}
        if req.name is not None:
            data["name"] = req.name
        if req.content is not None:
            data["content"] = req.content
        if req.nav_id is not None:
            data["nav_id"] = req.nav_id
        data["editor_id"] = user_id
        await self.update_by_id(req.id, data)

    async def get_stats(self, kb_id: str) -> dict:
        """获取节点统计"""
        unpublished = await self.db.execute(
            select(func.count()).select_from(Node)
            .where(Node.kb_id == kb_id, Node.status != 2)
        )
        unstudied = await self.db.execute(
            select(func.count()).select_from(Node)
            .where(Node.kb_id == kb_id, Node.status == 2, Node.rag_info == None)
        )
        return {
            "unpublished_count": unpublished.scalar_one(),
            "unstudied_count": unstudied.scalar_one(),
            "unpublished_nav_count": 0,
        }

    async def action(self, req) -> None:
        """节点操作"""
        if req.action == "delete":
            await self.delete_by_id(req.id)

    async def move(self, req) -> None:
        """移动节点"""
        await self.update_by_id(req.id, {
            "parent_id": req.parent_id,
        })

    async def move_nav(self, req) -> None:
        """移动到其他栏目"""
        from sqlalchemy import update
        for node_id in req.node_ids:
            await self.db.execute(
                update(Node).where(Node.id == node_id).values(nav_id=req.nav_id)
            )
        await self.db.commit()

    async def batch_move(self, req) -> None:
        """批量移动"""
        from sqlalchemy import update
        for node_id in req.node_ids:
            await self.db.execute(
                update(Node).where(Node.id == node_id).values(parent_id=req.parent_id)
            )
        await self.db.commit()

    async def get_recommend_nodes(self, kb_id: str, nav_ids: list, node_ids: list) -> list:
        """获取推荐节点"""
        # TODO: 实现推荐逻辑
        return []

    async def get_permissions(self, kb_id: str, node_id: str) -> dict:
        """获取节点权限"""
        result = await self.db.execute(
            select(Node).where(Node.id == node_id, Node.kb_id == kb_id)
        )
        node = result.scalar_one_or_none()
        return node.permissions if node else {}

    async def edit_permissions(self, req) -> None:
        """编辑节点权限"""
        data = {}
        if req.answerable is not None:
            data["permissions"] = req.answerable  # TODO: 合并权限
        await self.update_by_id(req.node_id, data)

    async def get_share_list(self, kb_id: str) -> list:
        """获取前台节点列表"""
        # TODO: 实现权限过滤
        return await self.get_list(kb_id)

    async def get_share_detail(self, kb_id: str, node_id: str) -> Optional[dict]:
        """获取前台节点详情"""
        return await self.get_detail(kb_id, node_id)
