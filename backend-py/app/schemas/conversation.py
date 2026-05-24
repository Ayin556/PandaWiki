"""对话相关 Schema"""

from typing import Optional
from pydantic import BaseModel


class ConversationListItem(BaseModel):
    """对话列表项"""
    id: str
    kb_id: str
    subject: str = ""
    remote_ip: str = ""
    created_at: str = ""

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    """对话列表响应"""
    list: list[ConversationListItem]


class ConversationDetailResponse(BaseModel):
    """对话详情响应"""
    id: str
    kb_id: str
    subject: str = ""
    messages: list[dict] = []

    class Config:
        from_attributes = True


class MessageFeedbackListItem(BaseModel):
    """消息反馈列表项"""
    id: str
    conversation_id: str = ""
    kb_id: str = ""
    role: str = ""
    content: str = ""
    info: Optional[dict] = None
    created_at: str = ""

    class Config:
        from_attributes = True


class MessageFeedbackListResponse(BaseModel):
    """消息反馈列表响应"""
    list: list[MessageFeedbackListItem]


class MessageDetailResponse(BaseModel):
    """消息详情响应"""
    id: str
    conversation_id: str = ""
    role: str = ""
    content: str = ""
    info: Optional[dict] = None

    class Config:
        from_attributes = True
