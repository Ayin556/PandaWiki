"""评论审核 API - 对应 Go 版 /api/pro/v1/comment_moderate"""

from fastapi import APIRouter
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import update

from app.api.deps import CurrentUser, DbSession
from app.models.comment import Comment

router = APIRouter()


class CommentModerateReq(BaseModel):
    ids: list[str]
    status: int  # -1=拒绝, 0=待审, 1=通过


@router.post("")
async def moderate_comments(
    req: CommentModerateReq,
    user: CurrentUser,
    db: DbSession,
):
    """批量审核评论"""
    if not req.ids:
        return None

    await db.execute(
        update(Comment)
        .where(Comment.id.in_(req.ids))
        .values(status=req.status)
    )
    await db.commit()

    status_text = {-1: "拒绝", 0: "待审", 1: "通过"}.get(req.status, "未知")
    logger.info(f"Moderated {len(req.ids)} comments to status={req.status}({status_text})")
    return None
