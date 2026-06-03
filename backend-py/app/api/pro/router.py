"""Pro 版 API 路由 - 对应 Go 版 /api/pro/v1/* 前缀"""

from fastapi import APIRouter

from app.api.pro.prompt import router as prompt_router
from app.api.pro.token import router as token_router
from app.api.pro.block import router as block_router
from app.api.pro.comment_moderate import router as comment_moderate_router
from app.api.pro.document_feedback import router as document_feedback_router
from app.api.pro.contribute import router as contribute_router
from app.api.pro.node import router as node_router
from app.api.pro.auth_group import router as auth_group_router
from app.api.pro.auth import router as auth_router

pro_router = APIRouter()

pro_router.include_router(prompt_router, prefix="/prompt", tags=["Pro-提示词管理"])
pro_router.include_router(token_router, prefix="/token", tags=["Pro-API Token管理"])
pro_router.include_router(block_router, prefix="/block", tags=["Pro-内容屏蔽词"])
pro_router.include_router(comment_moderate_router, prefix="/comment_moderate", tags=["Pro-评论审核"])
pro_router.include_router(document_feedback_router, prefix="/document", tags=["Pro-文档评价反馈"])
pro_router.include_router(contribute_router, prefix="/contribute", tags=["Pro-贡献管理"])
pro_router.include_router(node_router, prefix="/node", tags=["Pro-文档历史版本"])
pro_router.include_router(auth_group_router, prefix="/auth/group", tags=["Pro-访客权限组"])
pro_router.include_router(auth_router, prefix="/auth", tags=["Pro-认证管理"])
