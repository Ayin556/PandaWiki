"""前台认证 API"""

from fastapi import APIRouter
from app.api.deps import DbSession, KbId
from app.services.auth import AuthService

router = APIRouter()


@router.get("/get")
async def auth_get(kb_id: KbId, db: DbSession):
    """获取认证类型 - 对应 Go 版 ShareAuthHandler.AuthGet"""
    service = AuthService(db)
    return await service.get_share_auth(kb_id)


@router.post("/login/simple")
async def auth_login_simple(req: dict, db: DbSession):
    """简单口令登录 - 对应 Go 版 ShareAuthHandler.AuthLoginSimple"""
    service = AuthService(db)
    return await service.login_simple(req)


@router.post("/github")
async def auth_github(req: dict, db: DbSession):
    """GitHub OAuth登录 - 对应 Go 版 ShareAuthHandler.AuthGitHub"""
    service = AuthService(db)
    return await service.login_github(req)
