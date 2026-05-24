"""评论管理 API - 对应 Go 版 handler/v1/comment.go"""

from fastapi import APIRouter, Query
from app.api.deps import CurrentUser, DbSession
from app.services.comment import CommentService

router = APIRouter()


@router.get("")
async def get_comment_list(kb_id: str, offset: int = 0, limit: int = 20, user: CurrentUser = None, db: DbSession = None):
    """获取待审核评论列表 - 对应 Go 版 CommentHandler.GetCommentModeratedList"""
    service = CommentService(db)
    return await service.get_comment_list(kb_id, offset, limit)


@router.delete("/list")
async def delete_comment_list(ids: list[str], user: CurrentUser, db: DbSession):
    """批量删除评论 - 对应 Go 版 CommentHandler.DeleteCommentList"""
    service = CommentService(db)
    await service.delete_comment_list(ids)
    return {"message": "Comments deleted successfully"}
