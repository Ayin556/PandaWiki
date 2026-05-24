"""模型服务 - 对应 Go 版 usecase/model.go"""

import asyncio

from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import PandaWikiException
from app.models.model import Model
from app.repositories.model import ModelRepository
from app.repositories.setting import SystemSettingRepository
from app.infrastructure.rag import get_rag_service
from app.infrastructure.rag.base import ModelInfo

# 模型校验超时时间（秒）
MODEL_CHECK_TIMEOUT = 30

# 百智云自动模式 BaseURL - 对应 Go 版 consts.AutoModeBaseURL
AUTO_MODE_BASE_URL = "https://model-square.app.baizhi.cloud/v1"


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
        """校验模型可用性 - 对应 Go 版 CheckModel
        
        Go 版通过 modelkit.CheckModel 调用百智云 SDK，
        Python 版尝试通过 OpenAI 兼容接口验证，失败则返回不可用。
        """
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

        # 尝试调用模型验证，带超时保护
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(
                model=model.model,
                openai_api_key=model.api_key,
                base_url=model.base_url or None,
                max_tokens=10,
                request_timeout=MODEL_CHECK_TIMEOUT,
            )
            await asyncio.wait_for(llm.ainvoke("Hi"), timeout=MODEL_CHECK_TIMEOUT)
            return {"valid": True, "message": "模型可用"}
        except asyncio.TimeoutError:
            logger.warning(f"Model check timed out: {model.model}")
            return {"valid": False, "message": "模型校验超时，请检查网络连接"}
        except Exception as e:
            logger.warning(f"Model check failed: {e}")
            return {"valid": False, "message": f"模型不可用: {str(e)}"}

    async def switch_mode(self, req) -> dict:
        """切换模型模式 - 对应 Go 版 SwitchMode
        
        注意：Go 版通过 modelkit.CheckModel 调用百智云 SDK 验证 API Key，
        Python 版无法直接调用百智云 SDK，因此仅做基础校验，跳过实际 LLM 验证调用。
        """
        mode = req.mode
        api_key = req.auto_mode_api_key if hasattr(req, "auto_mode_api_key") else ""
        chat_model = req.chat_model if hasattr(req, "chat_model") else ""

        if mode == "auto":
            # 自动模式 - 基础校验 API Key 非空
            # Go 版通过 modelkit.CheckModel 验证百智云 API Key，
            # Python 版无法直接访问百智云 SDK，仅做非空校验
            if not api_key:
                raise PandaWikiException("自动模式需要提供 API Key")
            logger.info(f"Auto mode switch: API Key provided (length={len(api_key)})")

        # 更新模式设置
        await self._update_mode_setting(mode, api_key, chat_model)

        # 同步 RAG 模型
        await self._update_rag_models_by_mode(mode, api_key)

        return {"message": "模式切换成功"}

    async def get_mode_setting(self) -> dict:
        """获取模型模式设置 - 对应 Go 版 GetModelModeSetting"""
        from app.models.setting import SystemSetting
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == "model_setting_mode")
        )
        setting = result.scalar_one_or_none()
        if setting and setting.value:
            return setting.value
        # 默认返回手动模式 - 对应 Go 版 defaultSetting
        return {
            "mode": "manual",
            "auto_mode_api_key": "",
            "chat_model": "",
            "is_manual_embedding_updated": False,
        }

    async def _get_active_chat_model(self) -> Model | None:
        """获取当前活跃的对话模型"""
        result = await self.db.execute(
            select(Model).where(Model.type == "chat", Model.is_active == True)
        )
        return result.scalar_one_or_none()

    async def _update_mode_setting(self, mode: str, api_key: str = "", chat_model: str = "") -> None:
        """更新模式设置到系统设置表"""
        from app.models.setting import SystemSetting
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == "model_setting_mode")
        )
        setting = result.scalar_one_or_none()
        value = {
            "mode": mode,
            "auto_mode_api_key": api_key,
            "chat_model": chat_model,
            "is_manual_embedding_updated": False,
        }
        if setting:
            # 直接修改 ORM 对象属性，避免 JSONType 与 jsonb 列的类型不匹配问题
            setting.value = value
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
