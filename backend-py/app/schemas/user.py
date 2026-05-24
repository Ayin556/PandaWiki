"""用户相关 Schema"""

from pydantic import BaseModel


class LoginRequest(BaseModel):
    """登录请求"""
    account: str
    password: str


class LoginResponse(BaseModel):
    """登录响应"""
    token: str
    user_id: str


class UserResponse(BaseModel):
    """用户信息响应"""
    id: str
    account: str
    role: str

    class Config:
        from_attributes = True


class UserCreateRequest(BaseModel):
    """创建用户请求"""
    account: str
    password: str
    role: str = "user"


class UserListResponse(BaseModel):
    """用户列表响应"""
    users: list[UserResponse]


class ResetPasswordRequest(BaseModel):
    """重置密码请求"""
    user_id: str
    new_password: str


class DeleteUserRequest(BaseModel):
    """删除用户请求"""
    user_id: str
