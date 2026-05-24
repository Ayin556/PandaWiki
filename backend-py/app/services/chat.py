"""对话服务 - 对应 Go 版 usecase/chat.go"""

import json
import time
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.rag import get_rag_service
from app.infrastructure.rag.base import QueryRecordRequest
from app.models.conversation import Conversation, ConversationMessage, ConversationReference
from app.repositories.conversation import ConversationRepository
from app.repositories.node import NodeRepository
from app.services.llm import llm_service


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
        app_id = req.get("app_id", "")
        remote_ip = req.get("remote_ip", "")
        group_ids = req.get("group_ids", [])

        # 1. 创建或获取对话
        if not conversation_id:
            conversation = Conversation(
                id=str(uuid.uuid4()),
                kb_id=kb_id,
                app_id=app_id,
                subject=message[:100],
                remote_ip=remote_ip,
            )
            self.db.add(conversation)
            await self.db.commit()
            await self.db.refresh(conversation)
            conversation_id = conversation.id
        else:
            conversation = await self.conversation_repo.get_by_id(conversation_id)
            if not conversation:
                conversation_id = ""

        # 2. 保存用户消息
        user_msg = ConversationMessage(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            app_id=app_id,
            kb_id=kb_id,
            role="user",
            content=message,
            remote_ip=remote_ip,
        )
        self.db.add(user_msg)
        await self.db.commit()

        # 发送对话创建事件
        yield f"data: {json.dumps({'event': 'conversation', 'data': {'conversation_id': conversation_id}}, ensure_ascii=False)}\n\n"

        # 3. 获取系统提示词
        system_prompt = await self._get_system_prompt(kb_id)

        # 4. RAG 检索构建消息
        try:
            messages = await llm_service.build_conversation_with_rag(
                kb_id=kb_id,
                conversation_id=conversation_id,
                query=message,
                system_prompt=system_prompt,
                group_ids=group_ids,
            )
        except Exception as e:
            logger.warning(f"RAG retrieval failed, falling back to direct chat: {e}")
            from langchain_core.messages import SystemMessage, HumanMessage
            messages = []
            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))
            messages.append(HumanMessage(content=message))

        # 5. 流式 LLM 推理
        full_content = ""
        start_time = time.time()
        model_name = ""
        provider = ""
        prompt_tokens = 0
        completion_tokens = 0

        try:
            from langchain_core.messages import HumanMessage
            model = llm_service._get_chat_model(streaming=True)

            # 获取模型信息
            model_name = model.model_name

            async for chunk in model.astream(messages):
                content = chunk.content
                full_content += content
                event = json.dumps({
                    "event": "message",
                    "data": {"content": content},
                }, ensure_ascii=False)
                yield f"data: {event}\n\n"

        except Exception as e:
            logger.error(f"LLM streaming failed: {e}")
            event = json.dumps({"event": "error", "data": {"message": str(e)}}, ensure_ascii=False)
            yield f"data: {event}\n\n"
            full_content = f"Error: {str(e)}"

        # 6. 保存 AI 回复
        ai_msg = ConversationMessage(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            app_id=app_id,
            kb_id=kb_id,
            role="assistant",
            content=full_content,
            provider=provider,
            model=model_name,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            remote_ip=remote_ip,
            parent_id=user_msg.id,
        )
        self.db.add(ai_msg)

        # 更新对话主题（如果是第一条消息）
        if conversation and not conversation.subject:
            conversation.subject = message[:100]

        await self.db.commit()

        # 7. 发送完成事件
        yield f"data: {json.dumps({'event': 'done'}, ensure_ascii=False)}\n\n"

    async def search(self, req: dict) -> dict:
        """搜索知识库文档 - 对应 Go 版 ChatUsecase.Search"""
        kb_id = req.get("kb_id", "")
        query = req.get("query", "")
        top_k = req.get("top_k", 5)
        group_ids = req.get("group_ids", [])

        rag_service = get_rag_service()
        result = await rag_service.query_records(
            QueryRecordRequest(
                dataset_id=kb_id,
                query=query,
                top_k=top_k,
                group_ids=group_ids,
            )
        )
        return {
            "results": [
                {
                    "node_id": c.node_id,
                    "node_name": c.node_name,
                    "content": c.content,
                    "score": c.score,
                    "url": c.url,
                }
                for c in result.chunks
            ]
        }

    async def chat_completions(self, req: dict) -> dict:
        """OpenAI API兼容对话(非流式)"""
        messages = req.get("messages", [])
        model = req.get("model", "")

        # 转换为 LangChain 消息
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
        lc_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                lc_messages.append(SystemMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
            else:
                lc_messages.append(HumanMessage(content=content))

        try:
            result = await llm_service.generate(lc_messages, model)
            return {
                "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                "object": "chat.completion",
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": result},
                    "finish_reason": "stop",
                }],
            }
        except Exception as e:
            logger.error(f"Chat completions failed: {e}")
            return {"choices": [{"message": {"role": "assistant", "content": f"Error: {str(e)}"}}]}

    async def chat_completions_stream(self, req: dict) -> AsyncGenerator[str, None]:
        """OpenAI API兼容对话流式"""
        messages = req.get("messages", [])
        model = req.get("model", "")

        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
        lc_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                lc_messages.append(SystemMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
            else:
                lc_messages.append(HumanMessage(content=content))

        chat_model = llm_service._get_chat_model(model, streaming=True)
        chat_id = f"chatcmpl-{uuid.uuid4().hex[:8]}"

        try:
            async for chunk in chat_model.astream(lc_messages):
                content = chunk.content
                if content:
                    data = {
                        "id": chat_id,
                        "object": "chat.completion.chunk",
                        "choices": [{
                            "index": 0,
                            "delta": {"content": content},
                            "finish_reason": None,
                        }],
                    }
                    yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

            # 发送结束
            data = {
                "id": chat_id,
                "object": "chat.completion.chunk",
                "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
            }
            yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error(f"Chat completions stream failed: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

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

    async def _get_system_prompt(self, kb_id: str) -> str:
        """获取知识库系统提示词"""
        from app.models.setting import Setting
        result = await self.db.execute(
            select(Setting).where(Setting.kb_id == kb_id, Setting.key == "system_prompt")
        )
        setting = result.scalar_one_or_none()
        if setting and setting.value and setting.value.get("content"):
            return setting.value["content"]
        return "你是一个知识库助手，根据提供的参考资料回答用户的问题。请使用中文回答，保持简洁准确。"
