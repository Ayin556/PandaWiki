"""应用管理 API - 对应 Go 版 handler/v1/app.go"""

from fastapi import APIRouter, Query
from app.api.deps import CurrentUser, DbSession
from app.services.app import AppService

router = APIRouter()


@router.get("/detail")
async def get_app_detail(kb_id: str, type: str, user: CurrentUser, db: DbSession):
    """获取应用详情 - 对应 Go 版 AppHandler.GetAppDetail，Go 版接受 kb_id + type 参数"""
    service = AppService(db)
    return await service.get_app_detail_by_type(kb_id, type)


@router.put("")
async def update_app(req: dict, user: CurrentUser, db: DbSession):
    """更新应用配置 - 对应 Go 版 AppHandler.UpdateApp"""
    service = AppService(db)
    await service.update_app(req)
    return {"message": "Updated successfully"}


@router.delete("")
async def delete_app(id: str, kb_id: str, user: CurrentUser, db: DbSession):
    """删除应用 - 对应 Go 版 AppHandler.DeleteApp"""
    service = AppService(db)
    await service.delete_app(id, kb_id)
    return {"message": "Deleted successfully"}
