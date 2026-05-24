"""PandaWiki Backend - FastAPI 应用入口"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.share.router import share_router
from app.api.v1.router import v1_router
from app.core.config import settings
from app.core.middleware import RequestLogMiddleware, ReadOnlyMiddleware
from app.infrastructure.database import init_db
from app.infrastructure.redis import init_redis, close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("Starting PandaWiki Backend...")
    # 初始化数据库
    await init_db()
    # 初始化 Redis
    await init_redis()
    logger.info("PandaWiki Backend started successfully")
    yield
    # 关闭连接
    await close_redis()
    logger.info("PandaWiki Backend stopped")


def create_app() -> FastAPI:
    """创建 FastAPI 应用实例"""
    app = FastAPI(
        title="PandaWiki API",
        description="PandaWiki 知识库管理平台 API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/swagger" if settings.ENV == "development" else None,
        redoc_url=None,
    )

    # CORS 中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 自定义中间件
    app.add_middleware(RequestLogMiddleware)
    app.add_middleware(ReadOnlyMiddleware)

    # 注册路由
    app.include_router(v1_router, prefix="/api/v1")
    app.include_router(share_router, prefix="/share/v1")

    return app


app = create_app()
