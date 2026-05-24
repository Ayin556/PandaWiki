"""模型服务 - 对应 Go 版 usecase/model.go"""

from sqlalchemy.ext.asyncio import AsyncSession


class ModelService:
    """模型业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_list(self) -> list:
        """获取模型列表"""
        # TODO: 实现
        return []

    async def create(self, req) -> None:
        """创建模型"""
        # TODO: 实现
        pass

    async def update(self, req) -> None:
        """更新模型"""
        # TODO: 实现
        pass

    async def check_model(self, req) -> dict:
        """校验模型可用性"""
        # TODO: 实现
        return {"valid": False}

    async def switch_mode(self, req) -> None:
        """切换模型模式"""
        # TODO: 实现
        pass

    async def get_mode_setting(self) -> dict:
        """获取模型模式设置"""
        # TODO: 实现
        return {"mode": "manual"}
