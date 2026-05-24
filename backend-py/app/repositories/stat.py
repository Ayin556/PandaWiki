"""统计仓储"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.stat import StatPage, StatPageHour
from app.repositories.base import BaseRepository


class StatRepository(BaseRepository[StatPage]):
    """统计数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(StatPage, db)
