"""前台对话详情 API"""

from fastapi import APIRouter
from app.api.deps import DbSession
from app.services.conversation import ConversationService

router = APIRouter()


@router.get("/detail")
async def get_conversation_detail(id: str, kb_id: str, db: DbSession):
    """获取前台对话详情 - 对应 Go 版 ShareConversationHandler.GetConversationDetail"""
    service = ConversationService(db)
    return await service.get_share_conversation_detail(kb_id, id)
