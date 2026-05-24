"""API 依赖注入 - 对应 Go 版 middleware/ 目录"""

from typing import Annotated, AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_access_token
from app.infrastructure.database import async_session_factory
from app.infrastructure.redis import get_redis
from app.models.user import User
from app.repositories.user import UserRepository


# ==================== 数据库会话 ====================
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话"""
    async with async_session_factory() as session:
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db_session)]


# ==================== JWT 认证 ====================
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: DbSession,
) -> User | None:
    """获取当前认证用户 - 对应 Go 版 JWTMiddleware.Authorize"""
    if credentials is None:
        return None

    token = credentials.credentials

    # 检查是否是 API Token (不含 ".")
    if "." not in token:
        return await _get_user_by_api_token(token, db)

    # JWT Token
    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        user_repo = UserRepository(db)
        user = await user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        return user
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


async def _get_user_by_api_token(token: str, db: AsyncSession) -> User | None:
    """通过 API Token 获取用户"""
    redis = await get_redis()
    cached = await redis.get(f"api_token:{token}")
    if cached:
        user_repo = UserRepository(db)
        return await user_repo.get_by_id(cached)
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


CurrentUser = Annotated[User | None, Depends(get_current_user)]


# ==================== 权限验证 ====================
async def require_admin(user: CurrentUser) -> User:
    """要求管理员权限 - 对应 Go 版 ValidateUserRole"""
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


AdminUser = Annotated[User, Depends(require_admin)]


async def require_full_control(
    user: CurrentUser,
    kb_id: str,
    db: DbSession,
) -> User:
    """要求完全控制权限 - 对应 Go 版 ValidateKBUserPerm"""
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    if user.role == "admin":
        return user
    # 检查 kb_users 表中的权限
    from app.models.user import KBUser
    from sqlalchemy import select
    result = await db.execute(
        select(KBUser.perm).where(KBUser.kb_id == kb_id, KBUser.user_id == user.id)
    )
    perm = result.scalar_one_or_none()
    if not perm or perm not in ("full_control",):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Full control access required",
        )
    return user


# ==================== 知识库上下文 ====================
async def get_kb_id_from_header(
    x_kb_id: str = "",
) -> str:
    """从请求头获取知识库ID"""
    return x_kb_id


KbId = Annotated[str, Depends(get_kb_id_from_header)]
