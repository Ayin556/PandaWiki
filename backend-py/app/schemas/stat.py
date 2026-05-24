"""统计相关 Schema"""

from typing import Optional
from pydantic import BaseModel


class PageVisitRequest(BaseModel):
    """页面上报请求"""
    kb_id: str
    node_id: str = ""
    scene: int = 0
    session_id: str = ""
    ip: str = ""
    ua: str = ""
    referer: str = ""


class InstantCountResponse(BaseModel):
    """实时访问计数响应"""
    online_count: int = 0


class InstantPageItem(BaseModel):
    """实时页面项"""
    scene: int = 0
    node_id: str = ""
    ip: str = ""
    session_id: str = ""


class StatCountResponse(BaseModel):
    """全局统计响应"""
    pv: int = 0
    uv: int = 0
    session_count: int = 0
    conversation_count: int = 0


class HotPageItem(BaseModel):
    """热门页面项"""
    node_id: str = ""
    name: str = ""
    count: int = 0


class HotRefererItem(BaseModel):
    """热门来源项"""
    host: str = ""
    count: int = 0


class BrowserStatItem(BaseModel):
    """浏览器统计项"""
    name: str = ""
    count: int = 0


class GeoCountItem(BaseModel):
    """地理分布项"""
    country: str = ""
    province: str = ""
    city: str = ""
    count: int = 0


class ConversationDistributionItem(BaseModel):
    """对话分布项"""
    app_type: int = 0
    count: int = 0
