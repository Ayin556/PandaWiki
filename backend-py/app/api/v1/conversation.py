"""对话管理 API - 对应 Go 版 handler/v1/conversation.go"""

from fastapi import APIRouter, Query
from app.api.deps import CurrentUser, DbSession
from app.services.conversation import ConversationService

router = APIRouter()


@router.get("")
async def get_conversation_list(kb_id: str, offset: int = 0, limit: int = 20, user: CurrentUser = None, db: DbSession = None):
    """获取对话列表 - 对应 Go 版 ConversationHandler.GetConversationList"""
    service = ConversationService(db)
    return await service.get_conversation_list(kb_id, offset, limit)


@router.get("/detail")
async def get_conversation_detail(id: str, kb_id: str, user: CurrentUser, db: DbSession):
    """获取对话详情 - 对应 Go 版 ConversationHandler.GetConversationDetail"""
    service = ConversationService(db)
    return await service.get_conversation_detail(kb_id, id)


@router.get("/message/list")
async def get_message_feedback_list(kb_id: str, offset: int = 0, limit: int = 20, user: CurrentUser = None, db: DbSession = None):
    """获取消息反馈列表 - 对应 Go 版 ConversationHandler.GetMessageFeedBackList"""
    service = ConversationService(db)
    return await service.get_message_feedback_list(kb_id, offset, limit)


@router.get("/message/detail")
async def get_message_detail(id: str, kb_id: str, user: CurrentUser, db: DbSession):
    """获取消息详情 - 对应 Go 版 ConversationHandler.GetMessageDetail"""
    service = ConversationService(db)
    return await service.get_message_detail(kb_id, id)
