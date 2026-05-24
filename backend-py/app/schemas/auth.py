"""认证相关 Schema"""

from pydantic import BaseModel


class AuthGetRequest(BaseModel):
    """获取认证请求"""
    kb_id: str
    source_type: str = ""


class AuthSetRequest(BaseModel):
    """设置认证请求"""
    kb_id: str
    source_type: str
    client_id: str = ""
    client_secret: str = ""
    proxy: str = ""


class AuthDeleteRequest(BaseModel):
    """删除认证请求"""
    kb_id: str
    auth_id: str = ""
