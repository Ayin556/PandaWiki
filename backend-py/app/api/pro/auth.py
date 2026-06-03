"""认证管理 API - 对应 Go 版 Pro /api/pro/v1/auth/* (企微 SSO)"""

from fastapi import APIRouter, Query, HTTPException
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select, delete

from app.api.deps import CurrentUser, DbSession
from app.models.auth import AuthConfig, Auth

router = APIRouter()


class AuthSetReq(BaseModel):
    kb_id: str
    source_type: str = "wecom"
    client_id: str = ""
    client_secret: str = ""
    agent_id: str = ""
    proxy: str = ""
    # OAuth 相关
    authorize_url: str = ""
    token_url: str = ""
    user_info_url: str = ""
    scopes: list[str] = []
    # 字段映射
    id_field: str = ""
    name_field: str = ""
    email_field: str = ""
    avatar_field: str = ""
    # LDAP 相关
    ldap_server_url: str = ""
    bind_dn: str = ""
    bind_password: str = ""
    user_base_dn: str = ""
    user_filter: str = ""
    # CAS 相关
    cas_url: str = ""
    cas_version: str = ""


@router.get("/get")
async def get_auth_config(
    user: CurrentUser,
    db: DbSession,
    kb_id: str = Query(...),
    source_type: str = Query("wecom"),
):
    """获取认证配置"""
    result = await db.execute(
        select(AuthConfig).where(
            AuthConfig.kb_id == kb_id,
            AuthConfig.source_type == source_type,
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        return {
            "source_type": source_type,
            "client_id": "",
            "client_secret": "",
            "agent_id": "",
            "proxy": "",
            "authorize_url": "",
            "token_url": "",
            "user_info_url": "",
            "scopes": [],
            "id_field": "",
            "name_field": "",
            "email_field": "",
            "avatar_field": "",
            "auths": [],
        }

    setting = config.auth_setting or {}

    # 查询该认证方式下的认证用户
    auth_result = await db.execute(
        select(Auth).where(Auth.kb_id == kb_id, Auth.source_type == source_type)
    )
    auths = []
    for a in auth_result.scalars().all():
        ui = a.user_info or {}
        auths.append({
            "id": a.id,
            "username": ui.get("username", ""),
            "avatar_url": ui.get("avatar_url", ""),
            "ip": a.ip,
            "source_type": a.source_type,
            "created_at": a.created_at.isoformat() if a.created_at else "",
            "last_login_time": a.last_login_time.isoformat() if a.last_login_time else "",
        })

    return {
        "source_type": config.source_type,
        "client_id": setting.get("client_id", ""),
        "client_secret": setting.get("client_secret", ""),
        "agent_id": setting.get("agent_id", ""),
        "proxy": setting.get("proxy", ""),
        "authorize_url": setting.get("authorize_url", ""),
        "token_url": setting.get("token_url", ""),
        "user_info_url": setting.get("user_info_url", ""),
        "scopes": setting.get("scopes", []),
        "id_field": setting.get("id_field", ""),
        "name_field": setting.get("name_field", ""),
        "email_field": setting.get("email_field", ""),
        "avatar_field": setting.get("avatar_field", ""),
        "ldap_server_url": setting.get("ldap_server_url", ""),
        "bind_dn": setting.get("bind_dn", ""),
        "bind_password": setting.get("bind_password", ""),
        "user_base_dn": setting.get("user_base_dn", ""),
        "user_filter": setting.get("user_filter", ""),
        "cas_url": setting.get("cas_url", ""),
        "cas_version": setting.get("cas_version", ""),
        "auths": auths,
    }


@router.post("/set")
async def set_auth_config(
    req: AuthSetReq,
    user: CurrentUser,
    db: DbSession,
):
    """设置认证配置"""
    result = await db.execute(
        select(AuthConfig).where(
            AuthConfig.kb_id == req.kb_id,
            AuthConfig.source_type == req.source_type,
        )
    )
    config = result.scalar_one_or_none()

    auth_setting = {
        "client_id": req.client_id,
        "client_secret": req.client_secret,
        "agent_id": req.agent_id,
        "proxy": req.proxy,
        "authorize_url": req.authorize_url,
        "token_url": req.token_url,
        "user_info_url": req.user_info_url,
        "scopes": req.scopes,
        "id_field": req.id_field,
        "name_field": req.name_field,
        "email_field": req.email_field,
        "avatar_field": req.avatar_field,
        "ldap_server_url": req.ldap_server_url,
        "bind_dn": req.bind_dn,
        "bind_password": req.bind_password,
        "user_base_dn": req.user_base_dn,
        "user_filter": req.user_filter,
        "cas_url": req.cas_url,
        "cas_version": req.cas_version,
    }

    if config:
        config.auth_setting = auth_setting
    else:
        db.add(AuthConfig(
            kb_id=req.kb_id,
            source_type=req.source_type,
            auth_setting=auth_setting,
        ))

    await db.commit()
    logger.info(f"Set auth config: kb_id={req.kb_id}, source_type={req.source_type}")
    return None


@router.delete("/delete")
async def delete_auth(
    user: CurrentUser,
    db: DbSession,
    id: int = Query(..., description="认证用户ID"),
    kb_id: str = Query(...),
):
    """删除认证用户"""
    await db.execute(
        delete(Auth).where(Auth.id == id, Auth.kb_id == kb_id)
    )
    await db.commit()
    logger.info(f"Deleted auth user: {id}, kb_id={kb_id}")
    return None
