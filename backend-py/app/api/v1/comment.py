"""评论管理 API - 对应 Go 版 handler/v1/comment.go"""

from typing import Optional

from fastapi import APIRouter, Query
from app.api.deps import CurrentUser, DbSession
from app.services.comment import CommentService

router = APIRouter()


@router.get("")
async def get_comment_list(
    kb_id: str,
    page: int = 1,
    per_page: int = 20,
    status: Optional[int] = None,
    user: CurrentUser = None,
    db: DbSession = None,
):
    """获取评论列表 - 对应 Go 版 CommentHandler.GetCommentModeratedList"""
    offset = (page - 1) * per_page
    service = CommentService(db)
    result = await service.get_comment_list(kb_id, offset, per_page, status)
    # 转换为前端期望的 {data, total} 格式
    return {"data": result["list"], "total": result["total"]}


@router.delete("/list")
async def delete_comment_list(ids: list[str], user: CurrentUser, db: DbSession):
    """批量删除评论 - 对应 Go 版 CommentHandler.DeleteCommentList"""
    service = CommentService(db)
    await service.delete_comment_list(ids)
    return {"message": "Comments deleted successfully"}
