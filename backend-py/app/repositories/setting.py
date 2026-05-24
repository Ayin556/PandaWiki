"""设置仓储"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.setting import Setting, SystemSetting
from app.repositories.base import BaseRepository


class SettingRepository(BaseRepository[Setting]):
    """知识库设置数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(Setting, db)


class SystemSettingRepository(BaseRepository[SystemSetting]):
    """系统设置数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(SystemSetting, db)
