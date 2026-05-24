"""开放平台/回调 API"""

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from app.api.deps import DbSession
from app.services.auth import AuthService

router = APIRouter()


@router.get("/github/callback")
async def github_callback(code: str, state: str, db: DbSession):
    """GitHub OAuth回调 - 对应 Go 版 OpenapiV1Handler.GitHubCallback"""
    service = AuthService(db)
    result = await service.github_callback(code, state)
    if result.get("redirect_url"):
        return RedirectResponse(url=result["redirect_url"])
    return result


@router.post("/lark/bot/{kb_id}")
async def lark_bot(kb_id: str, request: Request, db: DbSession):
    """飞书/Lark机器人回调 - 对应 Go 版 OpenapiV1Handler.LarkBot"""
    # TODO: 实现飞书机器人回调
    return ""
