"""对话相关 Schema"""

from typing import Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    """对话请求"""
    kb_id: str
    message: str
    conversation_id: str = ""
    app_id: str = ""


class ChatSearchRequest(BaseModel):
    """对话搜索请求"""
    kb_id: str
    query: str
    top_k: int = 5


class ChatSearchResponse(BaseModel):
    """对话搜索响应"""
    results: list[dict]
