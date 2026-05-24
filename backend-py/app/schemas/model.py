"""模型相关 Schema"""

from typing import Optional
from pydantic import BaseModel


class ModelCreateRequest(BaseModel):
    """创建模型请求"""
    provider: str = ""
    model: str = ""
    api_key: str = ""
    api_header: str = ""
    base_url: str = ""
    api_version: str = ""
    type: str = "chat"
    parameters: Optional[dict] = None


class ModelUpdateRequest(BaseModel):
    """更新模型请求"""
    id: str
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None
    api_header: Optional[str] = None
    base_url: Optional[str] = None
    api_version: Optional[str] = None
    is_active: Optional[bool] = None
    parameters: Optional[dict] = None


class ModelCheckRequest(BaseModel):
    """校验模型请求"""
    model_id: str = ""


class ModelListItem(BaseModel):
    """模型列表项"""
    id: str
    provider: str
    model: str
    type: str
    is_active: bool
    base_url: str = ""
    parameters: Optional[dict] = None


class ModelListResponse(BaseModel):
    """模型列表响应"""
    list: list[ModelListItem]


class SwitchModeRequest(BaseModel):
    """切换模型模式请求"""
    mode: str  # manual / auto
    api_key: str = ""
