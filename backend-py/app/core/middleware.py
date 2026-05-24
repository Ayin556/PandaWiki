"""FastAPI 中间件"""

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from loguru import logger

from app.core.config import settings
from app.core.exceptions import ReadOnlyException, to_http_exception


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
            return Response(
                content='{"detail":{"code":"READONLY","message":"System is in read-only mode"}}',
                status_code=http_exc.status_code,
                media_type="application/json",
            )
        return await call_next(request)
