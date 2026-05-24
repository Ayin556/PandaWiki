"""评论仓储"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.comment import Comment
from app.repositories.base import BaseRepository


class CommentRepository(BaseRepository[Comment]):
    """评论数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(Comment, db)
