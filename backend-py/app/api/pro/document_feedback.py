"""文档评价反馈 API - 对应 Go 版 Pro /api/pro/v1/document/*"""

from fastapi import APIRouter, Query
from loguru import logger
from sqlalchemy import select, delete, func

from app.api.deps import CurrentUser, DbSession
from app.models.document_feedback import DocumentFeedback

router = APIRouter()


@router.get("/list")
async def list_document_feedback(
    user: CurrentUser,
    db: DbSession,
    kb_id: str = Query(..., description="知识库ID"),
    page: int = Query(1, ge=1, description="页码"),
    per_page: int = Query(20, ge=1, le=100, description="每页条数"),
):
    """获取文档评价反馈列表 - 前端期望 { data: [], total: N }"""
    # 查询总数
    count_result = await db.execute(
        select(func.count()).select_from(DocumentFeedback).where(DocumentFeedback.kb_id == kb_id)
    )
    total = count_result.scalar() or 0

    # 分页查询
    result = await db.execute(
        select(DocumentFeedback)
        .where(DocumentFeedback.kb_id == kb_id)
        .order_by(DocumentFeedback.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    items = result.scalars().all()

    data = []
    for item in items:
        info = item.info or {}
        data.append({
            "id": item.id,
            "kb_id": item.kb_id,
            "node_id": item.node_id,
            "node_name": "",
            "content": item.content,
            "correction_suggestion": item.correction_suggestion,
            "created_at": item.created_at.isoformat() if item.created_at else "",
            "user_id": item.user_id,
            "info": {
                "auth_user_id": info.get("auth_user_id", 0),
                "avatar": info.get("avatar", ""),
                "email": info.get("email", ""),
                "remote_ip": info.get("remote_ip", ""),
                "screen_shot": info.get("screen_shot", ""),
                "user_name": info.get("user_name", ""),
            },
            "ip_address": {
                "ip": info.get("remote_ip", ""),
                "country": "",
                "province": "",
                "city": "",
            },
        })

    return {"data": data, "total": total}


@router.delete("/feedback")
async def delete_document_feedback(
    user: CurrentUser,
    db: DbSession,
    ids: list[str] = Query(..., description="反馈ID列表"),
):
    """批量删除文档反馈"""
    if not ids:
        return None

    await db.execute(
        delete(DocumentFeedback).where(DocumentFeedback.id.in_(ids))
    )
    await db.commit()
    logger.info(f"Deleted {len(ids)} document feedback items")
    return None
