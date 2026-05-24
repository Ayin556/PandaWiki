"""评论相关 Schema"""

from typing import Optional
from pydantic import BaseModel


class CommentCreateRequest(BaseModel):
    """创建评论请求"""
    kb_id: str
    node_id: str = ""
    content: str = ""
    parent_id: str = ""
    root_id: str = ""
    info: Optional[dict] = None
    pic_urls: list[str] = []


class CommentListItem(BaseModel):
    """评论列表项"""
    id: str
    kb_id: str
    node_id: str = ""
    user_id: str = ""
    content: str = ""
    status: int = 0
    parent_id: str = ""
    root_id: str = ""
    info: Optional[dict] = None
    pic_urls: list[str] = []
    created_at: str = ""


class CommentListResponse(BaseModel):
    """评论列表响应"""
    list: list[CommentListItem]
    total: int = 0


class CommentDeleteRequest(BaseModel):
    """删除评论请求"""
    ids: list[str]
