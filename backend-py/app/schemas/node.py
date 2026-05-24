"""文档节点相关 Schema"""

from typing import Optional
from pydantic import BaseModel


class NodeCreateRequest(BaseModel):
    """创建节点请求"""
    kb_id: str
    nav_id: str = ""
    name: str = ""
    content: str = ""
    type: int = 2
    parent_id: str = ""


class NodeUpdateRequest(BaseModel):
    """更新节点请求"""
    id: str
    kb_id: str
    name: Optional[str] = None
    content: Optional[str] = None
    nav_id: Optional[str] = None
    meta: Optional[dict] = None
    permissions: Optional[dict] = None


class NodeDetailResponse(BaseModel):
    """节点详情响应"""
    id: str
    kb_id: str
    name: str
    content: str = ""
    type: int = 2
    status: int = 0
    nav_id: str = ""
    parent_id: str = ""
    meta: Optional[dict] = None
    permissions: Optional[dict] = None
    rag_info: Optional[dict] = None
    creator_id: str = ""
    editor_id: str = ""

    class Config:
        from_attributes = True


class NodeListItem(BaseModel):
    """节点列表项"""
    id: str
    name: str
    type: int
    status: int
    nav_id: str = ""
    parent_id: str = ""
    meta: Optional[dict] = None


class NodeListResponse(BaseModel):
    """节点列表响应"""
    list: list[NodeListItem]


class NodeListGroupNavResponse(BaseModel):
    """按栏目分组节点响应"""
    list: list[dict]


class NodeStatsResponse(BaseModel):
    """节点统计响应"""
    unpublished_count: int = 0
    unstudied_count: int = 0
    unpublished_nav_count: int = 0


class NodeActionRequest(BaseModel):
    """节点操作请求"""
    id: str
    kb_id: str
    action: str = "delete"


class NodeMoveRequest(BaseModel):
    """移动节点请求"""
    id: str
    kb_id: str
    parent_id: str = ""
    prev_id: str = ""
    next_id: str = ""


class NodeMoveNavRequest(BaseModel):
    """移动到其他栏目请求 - 字段名与前端 V1NodeMoveNavReq 对齐"""
    ids: list[str]
    kb_id: str
    nav_id: str


class BatchMoveRequest(BaseModel):
    """批量移动请求 - 字段名与前端 DomainBatchMoveReq 对齐"""
    ids: list[str]
    kb_id: str
    parent_id: str = ""


class NodeSummaryRequest(BaseModel):
    """节点摘要请求"""
    node_id: str
    kb_id: str


class NodePermissionResponse(BaseModel):
    """节点权限响应"""
    answerable: dict = {}
    visitable: dict = {}
    visible: dict = {}


class NodePermissionEditRequest(BaseModel):
    """编辑节点权限请求"""
    node_id: str
    kb_id: str
    answerable: Optional[dict] = None
    visitable: Optional[dict] = None
    visible: Optional[dict] = None
