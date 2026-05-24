"""模型仓储"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.model import Model
from app.repositories.base import BaseRepository


class ModelRepository(BaseRepository[Model]):
    """模型数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(Model, db)
