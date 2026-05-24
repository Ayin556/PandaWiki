"""自定义异常"""

from fastapi import HTTPException, status


class PandaWikiException(Exception):
    """PandaWiki 基础异常"""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class NotFoundException(PandaWikiException):
    """资源未找到"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, code="NOT_FOUND")


class ForbiddenException(PandaWikiException):
    """禁止访问"""
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, code="FORBIDDEN")


class UnauthorizedException(PandaWikiException):
    """未授权"""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, code="UNAUTHORIZED")


class BadRequestException(PandaWikiException):
    """请求错误"""
    def __init__(self, message: str = "Bad request"):
        super().__init__(message, code="BAD_REQUEST")


class RateLimitException(PandaWikiException):
    """请求频率限制"""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, code="RATE_LIMIT")


class ReadOnlyException(PandaWikiException):
    """只读模式"""
    def __init__(self, message: str = "System is in read-only mode"):
        super().__init__(message, code="READONLY")


# FastAPI 兼容的异常转换
def to_http_exception(exc: PandaWikiException) -> HTTPException:
    """将自定义异常转换为 FastAPI HTTPException"""
    status_map = {
        "NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "FORBIDDEN": status.HTTP_403_FORBIDDEN,
        "UNAUTHORIZED": status.HTTP_401_UNAUTHORIZED,
        "BAD_REQUEST": status.HTTP_400_BAD_REQUEST,
        "RATE_LIMIT": status.HTTP_429_TOO_MANY_REQUESTS,
        "READONLY": status.HTTP_503_SERVICE_UNAVAILABLE,
    }
    return HTTPException(
        status_code=status_map.get(exc.code, status.HTTP_500_INTERNAL_SERVER_ERROR),
        detail={"code": exc.code, "message": exc.message},
    )
