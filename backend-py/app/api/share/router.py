"""前台共享 API 路由"""

from fastapi import APIRouter

from app.api.share.chat import router as chat_router
from app.api.share.auth import router as auth_router
from app.api.share.app import router as app_router
from app.api.share.node import router as node_router
from app.api.share.nav import router as nav_router
from app.api.share.comment import router as comment_router
from app.api.share.common import router as common_router
from app.api.share.conversation import router as conversation_router
from app.api.share.captcha import router as captcha_router
from app.api.share.stat import router as stat_router
from app.api.share.sitemap import router as sitemap_router
from app.api.share.wechat import router as wechat_router
from app.api.share.openapi import router as openapi_router

share_router = APIRouter()

share_router.include_router(app_router, prefix="/app", tags=["前台应用信息"])
share_router.include_router(auth_router, prefix="/auth", tags=["前台认证"])
share_router.include_router(chat_router, prefix="/chat", tags=["前台对话"])
share_router.include_router(node_router, prefix="/node", tags=["前台文档"])
share_router.include_router(nav_router, prefix="/nav", tags=["前台栏目"])
share_router.include_router(comment_router, prefix="/comment", tags=["前台评论"])
share_router.include_router(common_router, prefix="/common", tags=["前台公共"])
share_router.include_router(conversation_router, prefix="/conversation", tags=["前台对话详情"])
share_router.include_router(captcha_router, prefix="/captcha", tags=["验证码"])
share_router.include_router(stat_router, prefix="/stat", tags=["前台统计"])
share_router.include_router(wechat_router, prefix="/app", tags=["微信集成"])
share_router.include_router(openapi_router, prefix="/openapi", tags=["开放平台"])
