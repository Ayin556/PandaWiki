"""对话服务 - 对应 Go 版 usecase/chat.go"""

import json
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.rag import get_rag_service
from app.repositories.conversation import ConversationRepository
from app.repositories.node import NodeRepository


class ChatService:
    """对话业务逻辑 - 核心AI对话功能"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.conversation_repo = ConversationRepository(db)
        self.node_repo = NodeRepository(db)

    async def chat(self, req: dict) -> AsyncGenerator[str, None]:
        """对话消息 (SSE流式) - 对应 Go 版 ChatUsecase.Chat

        完整流程:
        1. 获取App配置
        2. 获取模型
        3. 创建/验证对话
        4. 保存用户消息
        5. RAG检索构建消息
        6. 流式LLM推理
        7. 保存AI回复
        """
        kb_id = req.get("kb_id", "")
        message = req.get("message", "")
        conversation_id = req.get("conversation_id", "")

        # TODO: 完整实现
        sse_event = json.dumps({"event": "message", "data": {"content": "Hello from PandaWiki!"}})
        yield f"data: {sse_event}\n\n"
        yield f"data: {json.dumps({'event': 'done'})}\n\n"

    async def search(self, req: dict) -> dict:
        """搜索知识库文档 - 对应 Go 版 ChatUsecase.Search"""
        kb_id = req.get("kb_id", "")
        query = req.get("query", "")
        top_k = req.get("top_k", 5)

        rag_service = get_rag_service()
        from app.infrastructure.rag.base import QueryRecordRequest
        result = await rag_service.query_records(
            QueryRecordRequest(
                dataset_id=kb_id,
                query=query,
                top_k=top_k,
            )
        )
        return {"results": [{"node_id": c.node_id, "content": c.content, "score": c.score} for c in result.chunks]}

    async def chat_completions(self, req: dict) -> dict:
        """OpenAI API兼容对话 - 对应 Go 版 ShareChatHandler.ChatCompletions"""
        # TODO: 实现 OpenAI 兼容接口
        return {"choices": [{"message": {"role": "assistant", "content": "TODO"}}]}

    async def chat_completions_stream(self, req: dict) -> AsyncGenerator[str, None]:
        """OpenAI API兼容对话流式"""
        yield f"data: {json.dumps({'choices': [{'delta': {'content': 'TODO'}}]})}\n\n"
        yield "data: [DONE]\n\n"

    async def chat_widget(self, req: dict) -> AsyncGenerator[str, None]:
        """Widget对话 (SSE流式)"""
        async for chunk in self.chat(req):
            yield chunk

    async def widget_search(self, req: dict) -> dict:
        """Widget搜索"""
        return await self.search(req)

    async def feedback(self, req: dict) -> None:
        """对话反馈"""
        await self.conversation_repo.update_message_feedback(
            req.get("message_id", ""),
            req.get("score", 0),
            req.get("type", ""),
            req.get("content", ""),
        )
