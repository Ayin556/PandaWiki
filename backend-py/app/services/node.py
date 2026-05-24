"""文档节点服务 - 对应 Go 版 usecase/node.go"""

from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.node import NodeRepository
from app.repositories.nav import NavRepository


class NodeService:
    """文档节点业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NodeRepository(db)
        self.nav_repo = NavRepository(db)

    async def create_node(self, req, user_id: str) -> str:
        """创建节点"""
        return await self.repo.create(req, user_id)

    async def get_node_list(self, **kwargs) -> list:
        """获取节点列表"""
        return await self.repo.get_list(**kwargs)

    async def get_node_list_group_nav(self, **kwargs) -> dict:
        """按栏目分组获取节点列表"""
        return await self.repo.get_list_group_by_nav(**kwargs)

    async def get_node_detail(self, kb_id: str, node_id: str, format: str = "markdown") -> Optional[dict]:
        """获取节点详情"""
        return await self.repo.get_detail(kb_id, node_id, format)

    async def update_node(self, req, user_id: str) -> None:
        """更新节点"""
        await self.repo.update(req, user_id)

    async def get_node_stats(self, kb_id: str) -> dict:
        """获取节点统计"""
        return await self.repo.get_stats(kb_id)

    async def node_action(self, req) -> None:
        """节点操作"""
        await self.repo.action(req)

    async def move_node(self, req) -> None:
        """移动节点"""
        await self.repo.move(req)

    async def move_node_nav(self, req) -> None:
        """移动到其他栏目"""
        await self.repo.move_nav(req)

    async def batch_move_node(self, req) -> None:
        """批量移动"""
        await self.repo.batch_move(req)

    async def get_recommend_nodes(self, kb_id: str, nav_ids: list, node_ids: list) -> list:
        """获取推荐节点"""
        return await self.repo.get_recommend_nodes(kb_id, nav_ids, node_ids)

    async def summary_node(self, req) -> None:
        """异步生成摘要"""
        # TODO: 通过消息队列触发
        pass

    async def stream_summary_node(self, req) -> AsyncGenerator[str, None]:
        """流式生成摘要"""
        # TODO: 实现 LLM 流式摘要
        yield "data: {}\n\n"

    async def node_restudy(self, node_id: str, kb_id: str) -> None:
        """重新学习"""
        # TODO: 触发 RAG 重新索引
        pass

    async def get_node_permissions(self, kb_id: str, node_id: str) -> dict:
        """获取节点权限"""
        return await self.repo.get_permissions(kb_id, node_id)

    async def edit_node_permissions(self, req) -> None:
        """编辑节点权限"""
        await self.repo.edit_permissions(req)

    async def get_share_node_list(self, kb_id: str) -> list:
        """获取前台节点列表"""
        return await self.repo.get_share_list(kb_id)

    async def get_share_node_detail(self, kb_id: str, node_id: str) -> Optional[dict]:
        """获取前台节点详情"""
        return await self.repo.get_share_detail(kb_id, node_id)
