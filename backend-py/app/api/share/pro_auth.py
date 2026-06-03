"""前台 Pro 共享路由 - 企微 SSO OAuth 回调等"""

import json
import urllib.parse
from datetime import datetime, timezone

from fastapi import APIRouter, Query, Request, Response
from fastapi.responses import RedirectResponse
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select

from app.infrastructure.database import async_session_factory
from app.models.auth import Auth, AuthConfig

router = APIRouter()


class WecomAuthReq(BaseModel):
    kb_id: str = ""
    redirect_url: str = ""
    is_app: bool = False


@router.post("/wecom")
async def wecom_auth(req: WecomAuthReq):
    """获取企微授权 URL"""
    kb_id = req.kb_id

    async with async_session_factory() as db:
        result = await db.execute(
            select(AuthConfig).where(
                AuthConfig.kb_id == kb_id,
                AuthConfig.source_type == "wecom",
            )
        )
        config = result.scalar_one_or_none()

    if not config:
        return {"url": ""}

    setting = config.auth_setting or {}
    corp_id = setting.get("client_id", "")
    agent_id = setting.get("agent_id", "")

    if not corp_id:
        return {"url": ""}

    # 构建企微 OAuth URL
    state = json.dumps({"kb_id": kb_id, "redirect_url": req.redirect_url})
    state_encoded = urllib.parse.quote(state)

    if req.is_app:
        # 企微应用内 OAuth
        url = (
            f"https://open.weixin.qq.com/connect/oauth2/authorize"
            f"?appid={corp_id}"
            f"&redirect_uri={urllib.parse.quote(req.redirect_url)}"
            f"&response_type=code"
            f"&scope=snsapi_base"
            f"&state={state_encoded}"
            f"&agentid={agent_id}"
            f"#wechat_redirect"
        )
    else:
        # 企微扫码登录
        url = (
            f"https://open.work.weixin.qq.com/wwopen/sso/qrConnect"
            f"?appid={corp_id}"
            f"&agentid={agent_id}"
            f"&redirect_uri={urllib.parse.quote(req.redirect_url)}"
            f"&state={state_encoded}"
        )

    return {"url": url}


@router.get("/wecom/callback")
async def wecom_callback(
    request: Request,
    code: str = Query("", description="企微授权 code"),
    state: str = Query("", description="状态参数"),
):
    """企微 OAuth 回调"""
    if not code:
        return {"message": "code is required", "success": False}

    # 解析 state
    try:
        state_data = json.loads(urllib.parse.unquote(state)) if state else {}
    except (json.JSONDecodeError, ValueError):
        state_data = {}

    kb_id = state_data.get("kb_id", "")
    redirect_url = state_data.get("redirect_url", "")

    if not kb_id:
        # 尝试从 header 获取
        kb_id = request.headers.get("x-kb-id", "")

    # 获取企微配置
    async with async_session_factory() as db:
        result = await db.execute(
            select(AuthConfig).where(
                AuthConfig.kb_id == kb_id,
                AuthConfig.source_type == "wecom",
            )
        )
        config = result.scalar_one_or_none()

    if not config:
        logger.error(f"Wecom config not found for kb_id={kb_id}")
        return {"message": "Wecom config not found", "success": False}

    setting = config.auth_setting or {}
    corp_id = setting.get("client_id", "")
    corp_secret = setting.get("client_secret", "")

    # 用 code 换取 access_token
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            token_resp = await client.get(
                f"https://qyapi.weixin.qq.com/cgi-bin/gettoken",
                params={"corpid": corp_id, "corpsecret": corp_secret},
            )
            token_data = token_resp.json()

            if token_data.get("errcode") != 0:
                logger.error(f"Failed to get wecom access token: {token_data}")
                return {"message": "Failed to get access token", "success": False}

            access_token = token_data.get("access_token", "")

            # 获取用户信息
            user_resp = await client.get(
                f"https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo",
                params={"access_token": access_token, "code": code},
            )
            user_data = user_resp.json()

            if user_data.get("errcode") != 0:
                logger.error(f"Failed to get wecom user info: {user_data}")
                return {"message": "Failed to get user info", "success": False}

            userid = user_data.get("userid") or user_data.get("UserId", "")
            if not userid:
                # 可能是外部用户，用 openid
                userid = user_data.get("openid", "")

            # 获取用户详情
            detail_resp = await client.get(
                f"https://qyapi.weixin.qq.com/cgi-bin/user/get",
                params={"access_token": access_token, "userid": userid},
            )
            detail_data = detail_resp.json()

            username = detail_data.get("name", userid)
            avatar_url = detail_data.get("avatar", "")
            email = detail_data.get("email", "")

    except Exception as e:
        logger.error(f"Wecom OAuth error: {e}")
        return {"message": f"OAuth error: {str(e)}", "success": False}

    # 创建或更新认证记录
    async with async_session_factory() as db:
        auth_result = await db.execute(
            select(Auth).where(
                Auth.kb_id == kb_id,
                Auth.source_type == "wecom",
                Auth.union_id == userid,
            )
        )
        auth = auth_result.scalar_one_or_none()

        if auth:
            auth.user_info = {
                "username": username,
                "avatar_url": avatar_url,
                "email": email,
            }
            auth.last_login_time = datetime.now(timezone.utc)
            auth.ip = request.client.host if request.client else ""
        else:
            auth = Auth(
                kb_id=kb_id,
                source_type="wecom",
                union_id=userid,
                ip=request.client.host if request.client else "",
                last_login_time=datetime.now(timezone.utc),
                user_info={
                    "username": username,
                    "avatar_url": avatar_url,
                    "email": email,
                },
            )
            db.add(auth)

        await db.commit()
        await db.refresh(auth)

    logger.info(f"Wecom OAuth success: kb_id={kb_id}, user={username}")

    # 返回认证信息（前端可以据此设置登录状态）
    return {
        "message": "success",
        "success": True,
        "data": {
            "id": auth.id,
            "username": username,
            "avatar_url": avatar_url,
            "email": email,
        },
    }
