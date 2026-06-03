"""前台贡献提交 API - 对应 Go 版 Pro ShareContribute handler"""

from datetime import datetime, timezone

from fastapi import APIRouter, Request
from loguru import logger
from pydantic import BaseModel

from app.api.deps import DbSession
from app.core.captcha import captcha
from app.core.exceptions import BadRequestException
from app.models.contribute import Contribute

router = APIRouter()


class SubmitContributeReq(BaseModel):
    """前台用户提交贡献请求体"""
    captcha_token: str = ""
    content: str = ""
    content_type: str = "md"  # "html" | "md"
    emoji: str = ""
    name: str = ""
    node_id: str = ""
    reason: str = ""
    type: str = "add"  # "add" | "edit"


@router.post("/submit")
async def submit_contribute(
    request: Request,
    req: SubmitContributeReq,
    db: DbSession,
):
    """前台用户提交文档编辑或新增贡献 - POST /share/pro/v1/contribute/submit"""
    # 验证 captcha
    if req.captcha_token:
        if not captcha.validate_token(req.captcha_token):
            raise BadRequestException("failed to validate captcha")

    # 从 X-KB-ID header 获取知识库 ID
    kb_id = request.headers.get("x-kb-id", "")
    if not kb_id:
        raise BadRequestException("kb_id is required")

    # 获取客户端真实 IP
    ip = request.client.host if request.client else ""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    elif request.headers.get("x-real-ip"):
        ip = request.headers["x-real-ip"]

    # 创建贡献记录
    contribute = Contribute(
        kb_id=kb_id,
        node_id=req.node_id,
        name=req.name,
        content=req.content,
        meta={"content_type": req.content_type, "emoji": req.emoji},
        reason=req.reason,
        type=req.type,
        status="pending",
        auth_id=None,
        remote_ip=ip,
        audit_user_id="",
    )
    db.add(contribute)
    await db.commit()
    await db.refresh(contribute)

    logger.info(f"Contribute submitted: id={contribute.id}, kb_id={kb_id}, type={req.type}")

    return {"id": contribute.id, "message": "submitted"}
