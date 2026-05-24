"""对话服务 - 对应 Go 版 usecase/conversation.go"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.conversation import ConversationRepository


class ConversationService:
    """对话业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ConversationRepository(db)

    async def get_conversation_list(self, kb_id: str, offset: int, limit: int) -> list:
        """获取对话列表"""
        return await self.repo.get_conversation_list(kb_id, offset, limit)

    async def get_conversation_detail(self, kb_id: str, conversation_id: str) -> dict:
        """获取对话详情"""
        return await self.repo.get_conversation_detail(kb_id, conversation_id)

    async def get_message_feedback_list(self, kb_id: str, offset: int, limit: int) -> list:
        """获取消息反馈列表"""
        return await self.repo.get_message_feedback_list(kb_id, offset, limit)

    async def get_message_detail(self, kb_id: str, message_id: str) -> dict:
        """获取消息详情"""
        return await self.repo.get_message_detail(kb_id, message_id)

    async def get_share_conversation_detail(self, kb_id: str, conversation_id: str) -> dict:
        """获取前台对话详情"""
        return await self.repo.get_share_conversation_detail(kb_id, conversation_id)
