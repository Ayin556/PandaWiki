"""API Token仓储"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.api_token import APIToken
from app.repositories.base import BaseRepository


class APITokenRepository(BaseRepository[APIToken]):
    """API Token数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(APIToken, db)
