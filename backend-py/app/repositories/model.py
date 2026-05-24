"""模型仓储 - 对应 Go 版 repo/pg/model.go"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model import Model
from app.repositories.base import BaseRepository


class ModelRepository(BaseRepository[Model]):
    """模型数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(Model, db)

    async def get_by_type(self, model_type: str) -> Model | None:
        """按类型获取活跃模型"""
        result = await self.db.execute(
            select(Model).where(Model.type == model_type, Model.is_active == True)
        )
        return result.scalar_one_or_none()

    async def get_active_models(self) -> list[Model]:
        """获取所有活跃模型"""
        result = await self.db.execute(
            select(Model).where(Model.is_active == True).order_by(Model.created_at)
        )
        return list(result.scalars().all())

    async def update_usage(self, model_id: str, prompt_tokens: int, completion_tokens: int) -> None:
        """更新模型使用量统计"""
        model = await self.get_by_id(model_id)
        if model:
            from sqlalchemy import update
            await self.db.execute(
                update(Model)
                .where(Model.id == model_id)
                .values(
                    prompt_tokens=Model.prompt_tokens + prompt_tokens,
                    completion_tokens=Model.completion_tokens + completion_tokens,
                    total_tokens=Model.total_tokens + prompt_tokens + completion_tokens,
                )
            )
            await self.db.commit()
