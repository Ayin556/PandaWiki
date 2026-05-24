"""模型管理 API - 对应 Go 版 handler/v1/model.go"""

from fastapi import APIRouter
from app.api.deps import CurrentUser, AdminUser, DbSession
from app.schemas.model import (
    ModelListResponse, ModelCreateRequest, ModelUpdateRequest,
    ModelCheckRequest, SwitchModeRequest,
)
from app.services.model import ModelService

router = APIRouter()


@router.get("/list")
async def get_model_list(admin: AdminUser, db: DbSession):
    """获取模型列表 - 对应 Go 版 ModelHandler.GetModelList，直接返回数组"""
    service = ModelService(db)
    return await service.get_list()


@router.post("")
async def create_model(req: ModelCreateRequest, admin: AdminUser, db: DbSession):
    """创建模型 - 对应 Go 版 ModelHandler.CreateModel"""
    service = ModelService(db)
    await service.create(req)
    return {"message": "Model created successfully"}


@router.put("")
async def update_model(req: ModelUpdateRequest, admin: AdminUser, db: DbSession):
    """更新模型 - 对应 Go 版 ModelHandler.UpdateModel"""
    service = ModelService(db)
    await service.update(req)
    return {"message": "Model updated successfully"}


@router.post("/check")
async def check_model(req: ModelCheckRequest, admin: AdminUser, db: DbSession):
    """校验模型可用性 - 对应 Go 版 ModelHandler.CheckModel"""
    service = ModelService(db)
    result = await service.check_model(req)
    return result


@router.post("/provider/supported")
async def get_provider_supported_models(admin: AdminUser, db: DbSession):
    """获取供应商支持的模型列表 - 对应 Go 版 ModelHandler.GetProviderSupportedModelList"""
    return {"list": []}


@router.post("/switch-mode")
async def switch_mode(req: SwitchModeRequest, admin: AdminUser, db: DbSession):
    """切换模型模式 - 对应 Go 版 ModelHandler.SwitchMode"""
    service = ModelService(db)
    return await service.switch_mode(req)


@router.get("/mode-setting")
async def get_model_mode_setting(admin: AdminUser, db: DbSession):
    """获取模型模式设置 - 对应 Go 版 ModelHandler.GetModelModeSetting"""
    service = ModelService(db)
    return await service.get_mode_setting()
