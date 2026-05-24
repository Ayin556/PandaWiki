"""应用相关 Schema"""

from typing import Optional
from pydantic import BaseModel


class AppDetailResponse(BaseModel):
    """应用详情响应"""
    id: str
    kb_id: str
    name: str = ""
    type: int = 1
    settings: Optional[dict] = None

    class Config:
        from_attributes = True


class AppUpdateRequest(BaseModel):
    """更新应用请求"""
    id: str
    kb_id: str
    name: Optional[str] = None
    settings: Optional[dict] = None


class WebAppInfoResponse(BaseModel):
    """Web应用信息响应"""
    kb_id: str
    title: str = ""
    icon: str = ""
    description: str = ""
    theme: Optional[dict] = None
    watermark: Optional[dict] = None
    copy_setting: Optional[dict] = None
    chat: Optional[dict] = None
    welcome: Optional[dict] = None
    landing_page: Optional[dict] = None
    recommend_nodes: Optional[dict] = None
    feedback: Optional[dict] = None
    comment: Optional[dict] = None
    copyright: Optional[dict] = None
    disclaimer: Optional[dict] = None


class WidgetAppInfoResponse(BaseModel):
    """Widget应用信息响应"""
    kb_id: str
    title: str = ""
    icon: str = ""
    chat: Optional[dict] = None
    welcome: Optional[dict] = None
    recommend_nodes: Optional[dict] = None


class WechatAppInfoResponse(BaseModel):
    """微信应用信息响应"""
    kb_id: str
    enabled: bool = False
