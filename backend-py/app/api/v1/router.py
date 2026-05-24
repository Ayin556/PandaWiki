"""V1 管理后台 API 路由"""

from fastapi import APIRouter

from app.api.v1.user import router as user_router
from app.api.v1.knowledge_base import router as kb_router
from app.api.v1.node import router as node_router
from app.api.v1.nav import router as nav_router
from app.api.v1.model import router as model_router
from app.api.v1.app import router as app_router
from app.api.v1.auth import router as auth_router
from app.api.v1.conversation import router as conversation_router
from app.api.v1.comment import router as comment_router
from app.api.v1.crawler import router as crawler_router
from app.api.v1.creation import router as creation_router
from app.api.v1.file import router as file_router
from app.api.v1.stat import router as stat_router
from app.api.v1.license import router as license_router

v1_router = APIRouter()

v1_router.include_router(user_router, prefix="/user", tags=["用户管理"])
v1_router.include_router(kb_router, prefix="/knowledge_base", tags=["知识库管理"])
v1_router.include_router(node_router, prefix="/node", tags=["文档管理"])
v1_router.include_router(nav_router, prefix="/nav", tags=["栏目管理"])
v1_router.include_router(model_router, prefix="/model", tags=["模型管理"])
v1_router.include_router(app_router, prefix="/app", tags=["应用管理"])
v1_router.include_router(auth_router, prefix="/auth", tags=["授权管理"])
v1_router.include_router(conversation_router, prefix="/conversation", tags=["对话管理"])
v1_router.include_router(comment_router, prefix="/comment", tags=["评论管理"])
v1_router.include_router(crawler_router, prefix="/crawler", tags=["文档导入"])
v1_router.include_router(creation_router, prefix="/creation", tags=["AI创作"])
v1_router.include_router(file_router, prefix="/file", tags=["文件上传"])
v1_router.include_router(stat_router, prefix="/stat", tags=["统计分析"])
v1_router.include_router(license_router, prefix="/license", tags=["License管理"])
