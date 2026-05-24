"""仓储基类 - 泛型 CRUD 操作"""

from typing import Any, Generic, TypeVar, Type, Optional
from pydantic import BaseModel

from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """泛型仓储基类 - 提供通用 CRUD 操作"""

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: str | int) -> Optional[ModelType]:
        """根据ID获取"""
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(self, offset: int = 0, limit: int = 100) -> list[ModelType]:
        """获取所有"""
        result = await self.db.execute(
            select(self.model).offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, obj: ModelType) -> ModelType:
        """创建"""
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def update_by_id(self, id: str | int, data: dict) -> None:
        """根据ID更新"""
        await self.db.execute(
            update(self.model).where(self.model.id == id).values(**data)
        )
        await self.db.commit()

    async def delete_by_id(self, id: str | int) -> None:
        """根据ID删除"""
        await self.db.execute(
            delete(self.model).where(self.model.id == id)
        )
        await self.db.commit()

    async def count(self) -> int:
        """计数"""
        result = await self.db.execute(select(func.count()).select_from(self.model))
        return result.scalar_one()
