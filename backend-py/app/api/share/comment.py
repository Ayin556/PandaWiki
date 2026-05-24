"""前台评论 API"""

from fastapi import APIRouter
from app.api.deps import DbSession
from app.core.captcha import captcha
from app.core.exceptions import BadRequestException
from app.services.comment import CommentService

router = APIRouter()


@router.post("")
async def create_comment(req: dict, db: DbSession):
    """创建评论 - 对应 Go 版 ShareCommentHandler.CreateComment"""
    # 验证 captcha_token
    captcha_token = req.get("captcha_token", "")
    if not captcha.validate_token(captcha_token):
        raise BadRequestException("failed to validate captcha")
    service = CommentService(db)
    return await service.create_comment(req)


@router.get("/list")
async def get_comment_list(node_id: str, db: DbSession):
    """获取评论列表 - 对应 Go 版 ShareCommentHandler.GetCommentList"""
    service = CommentService(db)
    return await service.get_comment_list_by_node_id(node_id)
