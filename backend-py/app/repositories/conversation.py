"""对话仓储 - 对应 Go 版 repo/pg/conversation.go"""

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation, ConversationMessage
from app.repositories.base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    """对话数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(Conversation, db)

    async def get_conversation_list(self, kb_id: str, offset: int = 0, limit: int = 20) -> list:
        """获取对话列表"""
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.kb_id == kb_id)
            .order_by(Conversation.created_at.desc())
            .offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def get_conversation_detail(self, kb_id: str, conversation_id: str) -> dict | None:
        """获取对话详情"""
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            return None

        # 获取消息列表
        msg_result = await self.db.execute(
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conversation_id)
            .order_by(ConversationMessage.created_at)
        )
        messages = list(msg_result.scalars().all())
        return {
            "conversation": {
                "id": conversation.id,
                "kb_id": conversation.kb_id,
                "app_id": conversation.app_id,
                "subject": conversation.subject,
                "created_at": conversation.created_at.isoformat() if conversation.created_at else "",
            },
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "info": m.info or {},
                    "created_at": m.created_at.isoformat() if m.created_at else "",
                    "parent_id": m.parent_id,
                }
                for m in messages
            ],
        }

    async def get_message_feedback_list(self, kb_id: str, offset: int, limit: int) -> list:
        """获取消息反馈列表"""
        result = await self.db.execute(
            select(ConversationMessage)
            .where(ConversationMessage.kb_id == kb_id)
            .order_by(ConversationMessage.created_at.desc())
            .offset(offset).limit(limit)
        )
        messages = list(result.scalars().all())

        return [
            {
                "id": m.id,
                "conversation_id": m.conversation_id,
                "kb_id": m.kb_id,
                "role": m.role,
                "content": m.content[:100] + "..." if len(m.content) > 100 else m.content,
                "info": m.info or {},
                "created_at": m.created_at.isoformat() if m.created_at else "",
            }
            for m in messages
            if m.info and m.info.get("score")
        ]

    async def get_message_detail(self, kb_id: str, message_id: str) -> dict | None:
        """获取消息详情"""
        result = await self.db.execute(
            select(ConversationMessage).where(ConversationMessage.id == message_id)
        )
        msg = result.scalar_one_or_none()
        if not msg:
            return None
        return {
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "role": msg.role,
            "content": msg.content,
            "info": msg.info or {},
            "provider": msg.provider,
            "model": msg.model,
            "prompt_tokens": msg.prompt_tokens,
            "completion_tokens": msg.completion_tokens,
            "total_tokens": msg.total_tokens,
        }

    async def update_message_feedback(self, message_id: str, score: int, feedback_type: str, content: str) -> None:
        """更新消息反馈"""
        # 先获取现有 info
        result = await self.db.execute(
            select(ConversationMessage).where(ConversationMessage.id == message_id)
        )
        msg = result.scalar_one_or_none()
        if not msg:
            return

        info = msg.info or {}
        info["score"] = score
        info["type"] = feedback_type
        info["content"] = content

        await self.db.execute(
            update(ConversationMessage)
            .where(ConversationMessage.id == message_id)
            .values(info=info)
        )
        await self.db.commit()

    async def get_share_conversation_detail(self, kb_id: str, conversation_id: str) -> dict | None:
        """获取前台对话详情"""
        return await self.get_conversation_detail(kb_id, conversation_id)
