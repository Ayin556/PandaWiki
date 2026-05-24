"""栏目相关 Schema"""

from typing import Optional
from pydantic import BaseModel


class NavAddRequest(BaseModel):
    """添加栏目请求"""
    kb_id: str
    name: str
    position: Optional[int] = None


class NavUpdateRequest(BaseModel):
    """更新栏目请求"""
    kb_id: str
    id: str
    name: str


class NavDeleteRequest(BaseModel):
    """删除栏目请求"""
    kb_id: str
    id: str


class NavMoveRequest(BaseModel):
    """移动栏目请求"""
    kb_id: str
    id: str
    prev_id: str = ""
    next_id: str = ""


class NavListItem(BaseModel):
    """栏目列表项"""
    id: str
    name: str
    kb_id: str
    position: float = 0.0


class NavListResponse(BaseModel):
    """栏目列表响应"""
    list: list[NavListItem]
