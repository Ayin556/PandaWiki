"""授权管理 API - 对应 Go 版 handler/v1/auth.go"""

from fastapi import APIRouter
from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import AuthGetRequest, AuthSetRequest, AuthDeleteRequest
from app.services.auth import AuthService

router = APIRouter()


@router.get("/get")
async def get_auth(req: AuthGetRequest, user: CurrentUser, db: DbSession):
    """获取授权信息 - 对应 Go 版 AuthV1Handler.OpenAuthGet"""
    service = AuthService(db)
    return await service.get_auth(req.kb_id, req.source_type)


@router.post("/set")
async def set_auth(req: AuthSetRequest, user: CurrentUser, db: DbSession):
    """设置授权信息 - 对应 Go 版 AuthV1Handler.OpenAuthSet"""
    service = AuthService(db)
    await service.set_auth(req)
    return {"message": "Auth set successfully"}


@router.delete("/delete")
async def delete_auth(req: AuthDeleteRequest, user: CurrentUser, db: DbSession):
    """删除授权信息 - 对应 Go 版 AuthV1Handler.OpenAuthDelete"""
    service = AuthService(db)
    await service.delete_auth(req)
    return {"message": "Auth deleted successfully"}
