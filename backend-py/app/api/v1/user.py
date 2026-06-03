"""用户管理 API - 对应 Go 版 handler/v1/user.go"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, AdminUser, DbSession
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.ratelimit import rate_limiter
from app.schemas.user import (
    LoginRequest, LoginResponse,
    UserCreateRequest, UserResponse,
    UserListResponse, ResetPasswordRequest,
)
from app.services.user import UserService

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: DbSession):
    """用户登录 - 对应 Go 版 UserHandler.Login"""
    # IP 限速
    # if await rate_limiter.is_limited(ip):
    #     raise HTTPException(status_code=429, detail="Too many login attempts")

    service = UserService(db)
    user = await service.verify_user(req.account, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号或密码错误",
        )
    token = create_access_token({"user_id": user.id, "role": user.role})
    return LoginResponse(token=token, user_id=user.id)


@router.get("", response_model=UserResponse)
async def get_user_info(user: CurrentUser):
    """获取当前用户信息 - 对应 Go 版 UserHandler.GetUserInfo"""
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return UserResponse(
        id=user.id,
        account=user.account,
        role=user.role,
    )


@router.get("/list", response_model=UserListResponse)
async def list_users(user: CurrentUser, db: DbSession):
    """获取用户列表 - 对应 Go 版 UserHandler.ListUsers"""
    service = UserService(db)
    users = await service.list_users()
    return UserListResponse(users=[UserResponse.from_orm(u) for u in users])


@router.post("/create", response_model=UserResponse)
async def create_user(req: UserCreateRequest, admin: AdminUser, db: DbSession):
    """创建用户 - 对应 Go 版 UserHandler.CreateUser"""
    service = UserService(db)
    user = await service.create_user(req)
    return UserResponse.from_orm(user)


@router.put("/reset_password")
async def reset_password(req: ResetPasswordRequest, admin: AdminUser, db: DbSession):
    """重置密码 - 对应 Go 版 UserHandler.ResetPassword"""
    service = UserService(db)
    await service.reset_password(req.user_id, req.new_password)
    return {"message": "Password reset successfully"}


@router.delete("/delete")
async def delete_user(user_id: str, admin: AdminUser, db: DbSession):
    """删除用户 - 对应 Go 版 UserHandler.DeleteUser"""
    service = UserService(db)
    await service.delete_user(user_id)
    return {"message": "User deleted successfully"}
