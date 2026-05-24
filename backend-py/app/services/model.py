"""模型服务 - 对应 Go 版 usecase/model.go"""

from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.model import Model
from app.repositories.model import ModelRepository
from app.repositories.setting import SystemSettingRepository
from app.infrastructure.rag import get_rag_service
from app.infrastructure.rag.base import ModelInfo


# 默认系统提示词
SYSTEM_DEFAULT_PROMPT = (
    "你是一个知识库助手，根据提供的参考资料回答用户的问题。"
    "请使用中文回答，保持简洁准确。如果参考资料中没有相关信息，请坦诚告知。"
)


class ModelService:
    """模型业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ModelRepository(db)
        self.system_setting_repo = SystemSettingRepository(db)

    async def get_list(self) -> list[dict]:
        """获取模型列表 - 对应 Go 版 GetList"""
        result = await self.db.execute(select(Model).order_by(Model.created_at))
        models = list(result.scalars().all())
        return [
            {
                "id": m.id,
                "provider": m.provider,
                "model": m.model,
                "type": m.type,
                "is_active": m.is_active,
                "base_url": m.base_url,
                "parameters": m.parameters or {},
            }
            for m in models
        ]

    async def create(self, req) -> str:
        """创建模型 - 对应 Go 版 Create"""
        model = Model(
            provider=req.provider,
            model=req.model,
            api_key=req.api_key,
            api_header=req.api_header,
            base_url=req.base_url,
            api_version=req.api_version,
            type=req.type,
            parameters=req.parameters or {},
        )
        model = await self.repo.create(model)

        # 同步到 RAG 服务
        await self._sync_model_to_rag(model)

        return model.id

    async def update(self, req) -> None:
        """更新模型 - 对应 Go 版 Update"""
        data = {}
        if req.provider is not None:
            data["provider"] = req.provider
        if req.model is not None:
            data["model"] = req.model
        if req.api_key is not None:
            data["api_key"] = req.api_key
        if req.api_header is not None:
            data["api_header"] = req.api_header
        if req.base_url is not None:
            data["base_url"] = req.base_url
        if req.api_version is not None:
            data["api_version"] = req.api_version
        if req.is_active is not None:
            data["is_active"] = req.is_active
        if req.parameters is not None:
            data["parameters"] = req.parameters

        if data:
            await self.repo.update_by_id(req.id, data)
            # 同步到 RAG 服务
            model = await self.repo.get_by_id(req.id)
            if model and model.is_active:
                await self._sync_model_to_rag(model)

    async def check_model(self, req) -> dict:
        """校验模型可用性 - 对应 Go 版 CheckModel"""
        model_id = req.model_id if hasattr(req, "model_id") and req.model_id else ""

        if model_id:
            model = await self.repo.get_by_id(model_id)
            if not model:
                return {"valid": False, "message": "模型不存在"}
        else:
            # 检查默认模型
            model = await self._get_active_chat_model()

        if not model:
            return {"valid": False, "message": "无可用模型"}

        # 尝试调用模型验证
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(
                model=model.model,
                openai_api_key=model.api_key,
                base_url=model.base_url or None,
                max_tokens=10,
            )
            await llm.ainvoke("Hi")
            return {"valid": True, "message": "模型可用"}
        except Exception as e:
            logger.warning(f"Model check failed: {e}")
            return {"valid": False, "message": f"模型不可用: {str(e)}"}

    async def switch_mode(self, req) -> None:
        """切换模型模式 - 对应 Go 版 SwitchMode"""
        mode = req.mode
        api_key = req.api_key if hasattr(req, "api_key") else ""

        if mode == "auto":
            # 自动模式 - 校验 API Key
            if not api_key:
                raise ValueError("自动模式需要提供 API Key")
            try:
                from langchain_openai import ChatOpenAI
                llm = ChatOpenAI(
                    model=settings.CHAT_MODEL,
                    openai_api_key=api_key,
                    max_tokens=10,
                )
                await llm.ainvoke("Hi")
            except Exception as e:
                raise ValueError(f"API Key 校验失败: {e}")
        else:
            # 手动模式 - 检查模型是否已配置
            model_types = ["chat", "embedding", "rerank", "analysis"]
            for mt in model_types:
                result = await self.db.execute(
                    select(Model).where(Model.type == mt, Model.is_active == True)
                )
                model = result.scalar_one_or_none()
                if model is None:
                    # 尝试获取未激活的模型并激活
                    result = await self.db.execute(
                        select(Model).where(Model.type == mt)
                    )
                    inactive = result.scalar_one_or_none()
                    if inactive:
                        await self.repo.update_by_id(inactive.id, {"is_active": True})
                        logger.info(f"Auto-activated model: {inactive.id} ({mt})")

        # 更新模式设置
        await self._update_mode_setting(mode, api_key)

        # 同步 RAG 模型
        await self._update_rag_models_by_mode(mode, api_key)

    async def get_mode_setting(self) -> dict:
        """获取模型模式设置 - 对应 Go 版 GetModelModeSetting"""
        result = await self.db.execute(
            select(SystemSetting := type("SystemSetting", (), {})).__class__
            if False else __import__("app.models.setting", fromlist=["SystemSetting"]).SystemSetting
        )
        # 使用 repository 查询
        from app.models.setting import SystemSetting
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == "model_setting_mode")
        )
        setting = result.scalar_one_or_none()
        if setting and setting.value:
            return setting.value
        return {"mode": "manual", "api_key": "", "is_manual_embedding_updated": False}

    async def _get_active_chat_model(self) -> Model | None:
        """获取当前活跃的对话模型"""
        result = await self.db.execute(
            select(Model).where(Model.type == "chat", Model.is_active == True)
        )
        return result.scalar_one_or_none()

    async def _update_mode_setting(self, mode: str, api_key: str = "") -> None:
        """更新模式设置到系统设置表"""
        from app.models.setting import SystemSetting
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == "model_setting_mode")
        )
        setting = result.scalar_one_or_none()
        value = {
            "mode": mode,
            "api_key": api_key,
            "is_manual_embedding_updated": False,
        }
        if setting:
            await self.db.execute(
                update(SystemSetting)
                .where(SystemSetting.key == "model_setting_mode")
                .values(value=value)
            )
        else:
            new_setting = SystemSetting(
                key="model_setting_mode",
                value=value,
                description="模型模式设置",
            )
            self.db.add(new_setting)
        await self.db.commit()

    async def _sync_model_to_rag(self, model: Model) -> None:
        """同步模型到 RAG 服务"""
        try:
            rag_service = get_rag_service()
            model_info = ModelInfo(
                id=model.id,
                name=model.model,
                type=model.type,
                provider=model.provider,
                base_url=model.base_url,
                api_key=model.api_key,
            )
            await rag_service.upsert_model(model_info)
        except Exception as e:
            logger.warning(f"Failed to sync model to RAG: {e}")

    async def _update_rag_models_by_mode(self, mode: str, api_key: str = "") -> None:
        """根据模式更新 RAG 服务中的模型"""
        try:
            rag_service = get_rag_service()
            model_types = ["embedding", "rerank", "analysis", "analysis-vl", "chat"]

            for mt in model_types:
                if mode == "auto":
                    # 自动模式使用百智云默认模型
                    model_info = ModelInfo(
                        id=f"auto_{mt}",
                        name=settings.CHAT_MODEL,
                        type=mt,
                        provider="openai",
                        base_url="",
                        api_key=api_key,
                    )
                else:
                    # 手动模式从数据库获取
                    result = await self.db.execute(
                        select(Model).where(Model.type == mt, Model.is_active == True)
                    )
                    model = result.scalar_one_or_none()
                    if not model:
                        logger.warning(f"No active model for type: {mt}")
                        continue
                    model_info = ModelInfo(
                        id=model.id,
                        name=model.model,
                        type=model.type,
                        provider=model.provider,
                        base_url=model.base_url,
                        api_key=model.api_key,
                    )

                await rag_service.upsert_model(model_info)
        except Exception as e:
            logger.warning(f"Failed to update RAG models by mode: {e}")
