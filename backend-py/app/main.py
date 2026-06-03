"""PandaWiki Backend - FastAPI 应用入口"""

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.api.pro.router import pro_router
from app.api.share.contribute import router as share_contribute_router
from app.api.share.pro_auth import router as share_pro_auth_router
from app.api.share.router import share_router
from app.api.v1.router import v1_router
from app.core.config import settings
from app.core.exceptions import PandaWikiException
from app.core.middleware import (
    PWResponse,
    RequestLogMiddleware,
    ReadOnlyMiddleware,
    ResponseWrapperMiddleware,
)
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

    # 自定义中间件（注意顺序：后添加的先执行，ResponseWrapper 要先于 RequestLog）
    app.add_middleware(RequestLogMiddleware)
    app.add_middleware(ResponseWrapperMiddleware)
    app.add_middleware(ReadOnlyMiddleware)

    # 全局异常处理 - 包装为 PWResponse 格式
    @app.exception_handler(PandaWikiException)
    async def pandawiki_exception_handler(request: Request, exc: PandaWikiException):
        """自定义业务异常 -> PWResponse 格式"""
        code_map = {
            "NOT_FOUND": 40004,
            "FORBIDDEN": 40003,
            "UNAUTHORIZED": 40001,
            "BAD_REQUEST": 40000,
            "RATE_LIMIT": 40299,
            "READONLY": 50003,
        }
        status_map = {
            "NOT_FOUND": 404,
            "FORBIDDEN": 403,
            "UNAUTHORIZED": 401,
            "BAD_REQUEST": 400,
            "RATE_LIMIT": 429,
            "READONLY": 503,
        }
        return JSONResponse(
            content=PWResponse.error(exc.message, code=code_map.get(exc.code, 50001)),
            status_code=status_map.get(exc.code, 500),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """HTTP 异常 -> PWResponse 格式"""
        trace_id = str(uuid.uuid4()) if not hasattr(exc, "_trace_id") else exc._trace_id
        message = str(exc.detail)
        if isinstance(exc.detail, dict):
            message = exc.detail.get("message", str(exc.detail))
        return JSONResponse(
            content=PWResponse.error(message),
            status_code=exc.status_code,
        )

    # 注册路由
    app.include_router(v1_router, prefix="/api/v1")
    app.include_router(pro_router, prefix="/api/pro/v1")
    app.include_router(share_router, prefix="/share/v1")
    app.include_router(share_pro_auth_router, prefix="/share/pro/v1/auth", tags=["Share-Pro-企微认证"])
    app.include_router(share_pro_auth_router, prefix="/share/pro/v1/openapi", tags=["Share-Pro-企微回调"])
    app.include_router(share_contribute_router, prefix="/share/pro/v1/contribute", tags=["Share-Pro-贡献提交"])

    return app


app = create_app()
