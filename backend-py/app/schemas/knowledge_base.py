"""知识库相关 Schema"""

from typing import Optional
from pydantic import BaseModel


class KnowledgeBaseCreateRequest(BaseModel):
    """创建知识库请求"""
    name: str
    access_settings: Optional[dict] = None


class KnowledgeBaseUpdateRequest(BaseModel):
    """更新知识库请求"""
    id: str
    name: Optional[str] = None
    access_settings: Optional[dict] = None


class KnowledgeBaseDetailResponse(BaseModel):
    """知识库详情响应"""
    id: str
    name: str
    dataset_id: str = ""
    access_settings: Optional[dict] = None

    class Config:
        from_attributes = True


class KnowledgeBaseListItem(BaseModel):
    """知识库列表项"""
    id: str
    name: str
    created_at: str = ""


class KnowledgeBaseListResponse(BaseModel):
    """知识库列表响应"""
    list: list[KnowledgeBaseListItem]


class KBUserListResponse(BaseModel):
    """知识库用户列表响应"""
    list: list[dict]


class KBUserInviteRequest(BaseModel):
    """邀请用户请求"""
    kb_id: str
    user_id: str
    perm: str = "doc_manage"


class KBUserUpdateRequest(BaseModel):
    """更新用户权限请求"""
    kb_id: str
    user_id: str
    perm: str


class KBReleaseCreateRequest(BaseModel):
    """创建发布版本请求 - 与前端 DomainCreateKBReleaseReq 对齐"""
    kb_id: str
    tag: str = ""
    message: str = ""
    node_ids: list[str] = []


class KBReleaseListItem(BaseModel):
    """发布版本列表项"""
    id: str
    kb_id: str
    tag: str
    message: str
    publisher_id: str = ""


class KBReleaseListResponse(BaseModel):
    """发布版本列表响应"""
    list: list[KBReleaseListItem]
