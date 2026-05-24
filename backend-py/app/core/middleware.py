"""FastAPI 中间件与统一响应包装"""

import json
import time
from typing import Any

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.exceptions import ReadOnlyException, to_http_exception


class PWResponse:
    """统一响应格式 - 对应 Go 版 domain.PWResponse"""

    @staticmethod
    def success(data: Any = None) -> dict:
        """成功响应"""
        return {"message": "success", "success": True, "data": data, "code": 0}

    @staticmethod
    def error(message: str, code: int = 50001) -> dict:
        """失败响应"""
        return {"message": message, "success": False, "data": None, "code": code}


class RequestLogMiddleware(BaseHTTPMiddleware):
    """请求日志中间件"""

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        response = await call_next(request)
        duration = (time.time() - start_time) * 1000

        logger.info(
            f"{request.method} {request.url.path} "
            f"status={response.status_code} "
            f"duration={duration:.1f}ms "
            f"ip={request.client.host if request.client else 'unknown'}"
        )
        return response


class ReadOnlyMiddleware(BaseHTTPMiddleware):
    """只读模式中间件 - 非GET请求返回503"""

    async def dispatch(self, request: Request, call_next) -> Response:
        if settings.READONLY and request.method not in ("GET", "HEAD", "OPTIONS"):
            exc = ReadOnlyException()
            http_exc = to_http_exception(exc)
            return JSONResponse(
                content=PWResponse.error(exc.message, code=503),
                status_code=http_exc.status_code,
            )
        return await call_next(request)


class ResponseWrapperMiddleware(BaseHTTPMiddleware):
    """统一响应包装中间件 - 将所有 API 响应包装为 PWResponse 格式"""

    # 不需要包装的路径前缀（SSE流式、文档、验证码等不包装）
    EXCLUDED_PREFIXES = (
        "/swagger", "/redoc", "/openapi.json", "/docs",
        "/share/v1/captcha",
        "/share/v1/chat/message",
        "/share/v1/chat/widget",
        "/share/v1/chat/completions",
        "/api/v1/node/summary/stream",
        "/api/v1/creation/text",
    )

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # 排除非 API 路径和文档路径
        path = request.url.path
        if any(path.startswith(prefix) for prefix in self.EXCLUDED_PREFIXES):
            return response

        # 只处理 JSON 响应且状态码为 200 的情况
        if response.status_code != 200:
            return response

        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return response

        # 读取原始响应体
        body = b""
        async for chunk in response.body_iterator:
            body += chunk

        try:
            data = json.loads(body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        # 如果已经是 PWResponse 格式（包含 success 字段），不再重复包装
        if isinstance(data, dict) and "success" in data:
            return JSONResponse(content=data, status_code=200)

        # 包装为 PWResponse 格式
        wrapped = PWResponse.success(data)
        return JSONResponse(content=wrapped, status_code=200)
