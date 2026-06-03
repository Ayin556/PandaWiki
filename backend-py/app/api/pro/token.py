"""API Token 管理 API - 对应 Go 版 /api/pro/v1/token/*"""

import secrets

from fastapi import APIRouter, Query
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select, delete

from app.api.deps import CurrentUser, DbSession
from app.models.api_token import APIToken

router = APIRouter()


class CreateTokenReq(BaseModel):
    kb_id: str
    name: str
    permission: str = "doc_manage"  # full_control | doc_manage | data_operate


class UpdateTokenReq(BaseModel):
    id: str
    kb_id: str
    name: str | None = None
    permission: str | None = None


@router.post("/create")
async def create_token(
    req: CreateTokenReq,
    user: CurrentUser,
    db: DbSession,
):
    """创建 API Token"""
    # 生成 token: 对应 Go 版 uuid + 随机字符串
    token = f"pw_{secrets.token_hex(24)}"

    api_token = APIToken(
        name=req.name,
        user_id=user.id if user else "",
        token=token,
        kb_id=req.kb_id,
        permission=req.permission,
    )
    db.add(api_token)
    await db.commit()
    await db.refresh(api_token)

    logger.info(f"Created API token: {api_token.id}, kb_id={req.kb_id}")

    return {
        "id": api_token.id,
        "name": api_token.name,
        "token": api_token.token,
        "permission": api_token.permission,
        "created_at": api_token.created_at.isoformat() if api_token.created_at else "",
        "updated_at": api_token.updated_at.isoformat() if api_token.updated_at else "",
    }


@router.get("/list")
async def list_tokens(
    user: CurrentUser,
    db: DbSession,
    kb_id: str = Query(..., description="知识库ID"),
):
    """获取 Token 列表 - 前端期望直接返回数组"""
    result = await db.execute(
        select(APIToken).where(APIToken.kb_id == kb_id).order_by(APIToken.created_at.desc())
    )
    tokens = result.scalars().all()

    return [
        {
            "id": t.id,
            "name": t.name,
            "token": t.token,
            "permission": t.permission,
            "created_at": t.created_at.isoformat() if t.created_at else "",
            "updated_at": t.updated_at.isoformat() if t.updated_at else "",
        }
        for t in tokens
    ]


@router.patch("/update")
async def update_token(
    req: UpdateTokenReq,
    user: CurrentUser,
    db: DbSession,
):
    """更新 API Token"""
    result = await db.execute(
        select(APIToken).where(APIToken.id == req.id, APIToken.kb_id == req.kb_id)
    )
    token = result.scalar_one_or_none()
    if not token:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Token not found")

    if req.name is not None:
        token.name = req.name
    if req.permission is not None:
        token.permission = req.permission

    await db.commit()
    logger.info(f"Updated API token: {req.id}")
    return None


@router.delete("/delete")
async def delete_token(
    user: CurrentUser,
    db: DbSession,
    id: str = Query(..., description="Token ID"),
    kb_id: str = Query(..., description="知识库ID"),
):
    """删除 API Token"""
    await db.execute(
        delete(APIToken).where(APIToken.id == id, APIToken.kb_id == kb_id)
    )
    await db.commit()
    logger.info(f"Deleted API token: {id}, kb_id={kb_id}")
    return None
