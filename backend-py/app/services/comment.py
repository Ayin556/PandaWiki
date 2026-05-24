"""评论服务 - 对应 Go 版 usecase/comment.go"""

from sqlalchemy.ext.asyncio import AsyncSession


class CommentService:
    """评论业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_comment(self, req: dict) -> dict:
        """创建评论"""
        # TODO: 实现
        return {}

    async def get_comment_list(self, kb_id: str, offset: int, limit: int) -> list:
        """获取评论列表"""
        # TODO: 实现
        return []

    async def get_comment_list_by_node_id(self, node_id: str) -> list:
        """根据节点ID获取评论列表"""
        # TODO: 实现
        return []

    async def delete_comment_list(self, ids: list[str]) -> None:
        """批量删除评论"""
        # TODO: 实现
        pass
