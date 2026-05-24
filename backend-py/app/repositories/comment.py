"""评论仓储 - 对应 Go 版 repo/pg/comment.go"""

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.repositories.base import BaseRepository


class CommentRepository(BaseRepository[Comment]):
    """评论数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(Comment, db)

    async def get_by_kb_id(self, kb_id: str, offset: int = 0, limit: int = 20) -> list[Comment]:
        """按知识库获取评论列表"""
        result = await self.db.execute(
            select(Comment)
            .where(Comment.kb_id == kb_id)
            .order_by(Comment.created_at.desc())
            .offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_kb_id(self, kb_id: str) -> int:
        """按知识库统计评论数"""
        result = await self.db.execute(
            select(func.count()).select_from(Comment).where(Comment.kb_id == kb_id)
        )
        return result.scalar_one()

    async def get_by_node_id(self, node_id: str, offset: int = 0, limit: int = 20) -> list[Comment]:
        """按节点获取评论列表"""
        result = await self.db.execute(
            select(Comment)
            .where(Comment.node_id == node_id, Comment.status == 1)
            .order_by(Comment.created_at)
            .offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_node_id(self, node_id: str) -> int:
        """按节点统计评论数"""
        result = await self.db.execute(
            select(func.count()).select_from(Comment)
            .where(Comment.node_id == node_id, Comment.status == 1)
        )
        return result.scalar_one()

    async def delete_by_ids(self, ids: list[str]) -> int:
        """批量删除评论"""
        result = await self.db.execute(
            delete(Comment).where(Comment.id.in_(ids))
        )
        await self.db.commit()
        return result.rowcount
