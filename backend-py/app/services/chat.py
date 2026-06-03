"""对话服务 - 对应 Go 版 usecase/chat.go

完整实现 Go 版 Chat 方法的 SSE 事件流：
1. conversation_id / nonce 事件（新对话）
2. message_id 事件
3. chunk_result 事件（RAG 检索结果）
4. data 事件（LLM 流式输出）
5. done / error 事件
"""

import json
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AppType
from app.infrastructure.rag import get_rag_service
from app.infrastructure.rag.base import QueryRecordRequest
from app.models.conversation import Conversation, ConversationMessage
from app.models.model import Model
from app.models.node import NodeRelease
from app.models.setting import Setting, SystemSetting
from app.repositories.auth import AuthRepository
from app.repositories.conversation import ConversationRepository
from app.repositories.node import NodeRepository


class ChatService:
    """对话业务逻辑 - 核心AI对话功能，SSE事件格式完全匹配Go版"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.conversation_repo = ConversationRepository(db)
        self.node_repo = NodeRepository(db)

    async def chat(self, req: dict) -> AsyncGenerator[str, None]:
        """对话消息 (SSE流式) - 对应 Go 版 ChatUsecase.Chat

        SSE 事件格式（匹配 Go 版 SSEEvent 结构）：
        - {"type": "conversation_id", "content": "uuid"}  新对话时发送
        - {"type": "nonce", "content": "uuid"}             新对话时发送
        - {"type": "message_id", "content": "uuid"}        AI回复消息ID
        - {"type": "chunk_result", "content": "", "chunk_result": {...}}  RAG引用
        - {"type": "data", "content": "文本片段"}           LLM流式输出
        - {"type": "done"}                                 流结束
        - {"type": "error", "content": "错误信息"}          错误
        """
        kb_id = req.get("kb_id", "")
        message = req.get("message", "")
        conversation_id = req.get("conversation_id", "")
        app_id = req.get("app_id", "")
        remote_ip = req.get("remote_ip", "")
        nonce = req.get("nonce", "")

        # 获取用户 group_ids（对应 Go 版 AuthRepo.GetAuthGroupIdsWithParentsByAuthId）
        group_ids = await self._get_user_group_ids(req)

        conversation = None

        # 1. 创建或获取对话
        if not conversation_id:
            # 新建对话
            conversation_id = str(uuid.uuid4())
            new_nonce = str(uuid.uuid4())
            conversation = Conversation(
                id=conversation_id,
                kb_id=kb_id,
                app_id=app_id,
                subject=message[:100],
                remote_ip=remote_ip,
                nonce=new_nonce,
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(conversation)
            await self.db.commit()
            await self.db.refresh(conversation)

            # 发送 conversation_id 事件（Go 版：新对话时发送）
            yield self._sse_event({"type": "conversation_id", "content": conversation_id})
            # 发送 nonce 事件
            yield self._sse_event({"type": "nonce", "content": new_nonce})
        else:
            # 已有对话，验证 nonce
            conversation = await self.conversation_repo.get_by_id(conversation_id)
            if not conversation:
                yield self._sse_event({"type": "error", "content": "conversation not found"})
                return

        # 2. 保存用户消息
        user_msg_id = str(uuid.uuid4())
        ai_msg_id = str(uuid.uuid4())

        user_msg = ConversationMessage(
            id=user_msg_id,
            conversation_id=conversation_id,
            app_id=app_id,
            kb_id=kb_id,
            role="user",
            content=message,
            remote_ip=remote_ip,
        )
        self.db.add(user_msg)
        await self.db.commit()

        # 发送 message_id 事件（Go 版：AI回复的消息ID）
        yield self._sse_event({"type": "message_id", "content": ai_msg_id})

        # 3. 获取 Chat 模型配置（从数据库读取，匹配 Go 版 ModelUsecase.GetChatModel）
        try:
            chat_model_config = await self._get_chat_model_config()
        except Exception as e:
            logger.error(f"Failed to get chat model config: {e}")
            yield self._sse_event({"type": "error", "content": f"模型配置获取失败: {str(e)}"})
            return

        # 4. 获取系统提示词
        system_prompt = await self._get_system_prompt(kb_id)

        # 5. 获取知识库的 RAG dataset_id
        dataset_id = await self._get_dataset_id(kb_id)

        # 6. RAG 检索构建消息
        ranked_nodes = []
        try:
            messages, ranked_nodes = await self._build_conversation_with_rag(
                kb_id=kb_id,
                dataset_id=dataset_id,
                conversation_id=conversation_id,
                query=message,
                system_prompt=system_prompt,
                group_ids=group_ids,
            )
        except Exception as e:
            logger.warning(f"RAG retrieval failed, falling back to direct chat: {e}")
            messages = []
            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))
            messages.append(HumanMessage(content=message))

        # 7. 发送 chunk_result 事件（Go 版：RAG检索到的每个节点发送一个事件）
        for node in ranked_nodes:
            chunk_result = {
                "node_id": node.node_id,
                "name": node.node_name,
                "summary": node.node_summary,
                "emoji": node.node_emoji,
                "node_path_names": node.node_path_names,
            }
            yield self._sse_event({
                "type": "chunk_result",
                "content": "",
                "chunk_result": chunk_result,
            })

        # 7. 流式 LLM 推理
        full_content = ""
        model_name = chat_model_config.get("model_name", "")
        provider = chat_model_config.get("provider", "")
        prompt_tokens = 0
        completion_tokens = 0

        try:
            chat_model = ChatOpenAI(
                model=chat_model_config.get("model_name", "gpt-4o-mini"),
                openai_api_key=chat_model_config.get("api_key", ""),
                openai_api_base=chat_model_config.get("base_url", None),
                streaming=True,
                temperature=chat_model_config.get("temperature", 0.7),
                max_tokens=chat_model_config.get("max_tokens", None),
                default_headers=chat_model_config.get("api_header_dict", None),
            )

            async for chunk in chat_model.astream(messages):
                content = chunk.content
                if content:
                    full_content += content
                    yield self._sse_event({"type": "data", "content": content})

            # 尝试获取 token 用量（如果模型返回的话）
            if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                prompt_tokens = chunk.usage_metadata.get('input_tokens', 0)
                completion_tokens = chunk.usage_metadata.get('output_tokens', 0)

        except Exception as e:
            logger.error(f"LLM streaming failed: {e}")
            yield self._sse_event({"type": "error", "content": str(e)})
            full_content = f"Error: {str(e)}"

        # 8. 保存 AI 回复
        ai_msg = ConversationMessage(
            id=ai_msg_id,
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
            parent_id=user_msg_id,
        )
        self.db.add(ai_msg)

        # 更新对话主题（如果是第一条消息且主题为空）
        if conversation and not conversation.subject:
            conversation.subject = message[:100]

        await self.db.commit()

        # 9. 更新模型使用量统计
        model_id = chat_model_config.get("model_id")
        if model_id and (prompt_tokens or completion_tokens):
            try:
                from app.repositories.model import ModelRepository
                model_repo = ModelRepository(self.db)
                await model_repo.update_usage(model_id, prompt_tokens, completion_tokens)
            except Exception as e:
                logger.warning(f"Failed to update model usage: {e}")

        # 10. 发送完成事件
        yield self._sse_event({"type": "done"})

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
        messages = self._parse_messages(req.get("messages", []))

        try:
            chat_model_config = await self._get_chat_model_config()
            chat_model = ChatOpenAI(
                model=chat_model_config.get("model_name", "gpt-4o-mini"),
                openai_api_key=chat_model_config.get("api_key", ""),
                openai_api_base=chat_model_config.get("base_url", None),
                streaming=False,
                temperature=chat_model_config.get("temperature", 0.7),
            )
            result = await chat_model.ainvoke(messages)
            return {
                "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                "object": "chat.completion",
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": result.content},
                    "finish_reason": "stop",
                }],
            }
        except Exception as e:
            logger.error(f"Chat completions failed: {e}")
            return {"choices": [{"message": {"role": "assistant", "content": f"Error: {str(e)}"}}]}

    async def chat_completions_stream(self, req: dict) -> AsyncGenerator[str, None]:
        """OpenAI API兼容对话流式"""
        messages = self._parse_messages(req.get("messages", []))

        try:
            chat_model_config = await self._get_chat_model_config()
            chat_model = ChatOpenAI(
                model=chat_model_config.get("model_name", "gpt-4o-mini"),
                openai_api_key=chat_model_config.get("api_key", ""),
                openai_api_base=chat_model_config.get("base_url", None),
                streaming=True,
                temperature=chat_model_config.get("temperature", 0.7),
            )
            chat_id = f"chatcmpl-{uuid.uuid4().hex[:8]}"

            async for chunk in chat_model.astream(messages):
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
        """Widget对话 (SSE流式) - 与 chat 相同逻辑"""
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

    # ==================== 私有方法 ====================

    @staticmethod
    def _sse_event(event: dict) -> str:
        """格式化 SSE 事件 - 匹配 Go 版 writeSSEEvent 格式

        Go 版格式：data: {json}\n\n
        只使用 data: 字段，不使用 event: 字段
        """
        return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    async def _get_user_group_ids(self, req: dict) -> list[int]:
        """获取用户认证组ID列表 - 对应 Go 版 ChatUsecase.Chat 中的 groupIds 获取逻辑

        Go 版逻辑：
        1. 如果有登录用户 (user_id)，使用其 auth_user_id
        2. 如果是匿名用户 (auth_user_id=0)，尝试按 source_type 获取默认 auth
        3. 通过 GetAuthGroupIdsWithParentsByAuthId 获取 group_ids（含父组）
        4. 对于 Web 端匿名用户，source_type=""，通常无法找到 auth，group_ids 为空
        """
        auth_user_id = 0

        # 尝试从请求中获取 user_id（企业认证用户）
        user_id = req.get("user_id")
        if user_id:
            auth_user_id = int(user_id)

        # 匿名用户回退：按 app_type 获取默认 auth（Go 版: GetAuthBySourceType）
        if auth_user_id == 0:
            try:
                auth_repo = AuthRepository(self.db)
                app_type = req.get("app_type", AppType.WEB)
                # Go 版 AppTypeWeb.ToSourceType() 返回 ""
                source_type_map = {
                    AppType.WIDGET: "widget",
                    AppType.WECHAT: "wechat_bot",
                    AppType.WECOM: "wecom_ai_bot",
                    AppType.DINGTALK: "dingtalk_bot",
                    AppType.FEISHU: "feishu_bot",
                    AppType.DISCORD: "discord_bot",
                }
                source_type = source_type_map.get(app_type, "")
                if source_type:
                    auth = await auth_repo.get_auth_by_source_type(source_type)
                    if auth:
                        auth_user_id = auth.id
            except Exception as e:
                logger.warning(f"Failed to get auth by source type: {e}")

        # 获取 group_ids（Go 版: GetAuthGroupIdsWithParentsByAuthId）
        try:
            auth_repo = AuthRepository(self.db)
            group_ids = await auth_repo.get_auth_group_ids_with_parents(auth_user_id)
            return group_ids
        except Exception as e:
            logger.warning(f"Failed to get auth group ids: {e}")
            return []

    async def _get_chat_model_config(self) -> dict:
        """获取 Chat 模型配置 - 对应 Go 版 ModelUsecase.GetChatModel

        优先级：
        1. 自动模式(auto)：从系统设置读取 auto_mode_api_key，使用百智云固定地址
        2. 手动模式(manual)：从 models 表读取 type='chat' 的记录
        """
        # 1. 尝试读取模型模式设置
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == "model_setting_mode")
        )
        mode_setting = result.scalar_one_or_none()

        if mode_setting and mode_setting.value:
            mode = mode_setting.value.get("mode", "manual")
            auto_api_key = mode_setting.value.get("auto_mode_api_key", "")
            auto_chat_model = mode_setting.value.get("chat_model", "") or mode_setting.value.get("auto_mode_chat_model", "")

            if mode == "auto" and auto_api_key:
                # 自动模式：使用百智云固定配置
                return {
                    "model_id": "",
                    "provider": "BaiZhiCloud",
                    "model_name": auto_chat_model or "deepseek-chat",
                    "api_key": auto_api_key,
                    "base_url": "https://model-square.app.baizhi.cloud/v1",
                    "temperature": 0.7,
                    "max_tokens": None,
                    "api_header_dict": None,
                }

        # 2. 手动模式：从数据库读取
        result = await self.db.execute(
            select(Model).where(Model.type == "chat").limit(1)
        )
        model = result.scalar_one_or_none()

        if not model:
            raise ValueError("未配置 Chat 模型，请在管理后台配置模型")

        # 解析模型参数
        parameters = model.parameters or {}
        temperature = parameters.get("temperature", 0.7)
        max_tokens = parameters.get("max_tokens", None)

        # 构建 API 请求头
        api_header_dict = None
        if model.api_header:
            try:
                api_header_dict = json.loads(model.api_header)
            except (json.JSONDecodeError, TypeError):
                # 如果 api_header 是 "key:value" 格式
                if ":" in model.api_header:
                    key, value = model.api_header.split(":", 1)
                    api_header_dict = {key.strip(): value.strip()}

        # 处理 base_url：Go 版需要确保以 /v1 结尾
        base_url = model.base_url or None

        return {
            "model_id": model.id,
            "provider": model.provider or "",
            "model_name": model.model or "gpt-4o-mini",
            "api_key": model.api_key or "",
            "base_url": base_url,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "api_header_dict": api_header_dict,
        }

    async def _get_system_prompt(self, kb_id: str) -> str:
        """获取知识库系统提示词 - 对应 Go 版获取 SystemDefaultPrompt"""
        result = await self.db.execute(
            select(Setting).where(Setting.kb_id == kb_id, Setting.key == "system_prompt")
        )
        setting = result.scalar_one_or_none()
        if setting and setting.value and setting.value.get("content"):
            return setting.value["content"]
        return "你是一个知识库助手，根据提供的参考资料回答用户的问题。请使用中文回答，保持简洁准确。如果参考资料中没有相关信息，请如实告知用户。"

    async def _get_dataset_id(self, kb_id: str) -> str:
        """获取知识库对应的 RAG dataset_id - 对应 Go 版从 KB 读取 DatasetID"""
        from app.models.knowledge_base import KnowledgeBase
        result = await self.db.execute(
            select(KnowledgeBase).where(KnowledgeBase.id == kb_id)
        )
        kb = result.scalar_one_or_none()
        if kb and kb.dataset_id:
            return kb.dataset_id
        return kb_id  # 回退：使用 kb_id 作为 dataset_id

    async def _build_conversation_with_rag(
        self,
        kb_id: str,
        dataset_id: str,
        conversation_id: str,
        query: str,
        system_prompt: str = "",
        group_ids: list[int] = None,
    ) -> tuple[list, list]:
        """构建带RAG的对话消息 - 对应 Go 版 LLMUsecase.BuildConversationMessageWithRAG

        关键对齐点：
        1. 加载对话历史 → 移除最后一条用户消息作为 history
        2. RAG 检索传参：TopK=10, SimilarityThreshold=0.2, ChatHistory=历史消息, GroupIDs
        3. 按 doc_id 聚合 chunk，从 node_releases 补充元信息
        4. 用户提示词格式：Go 版 UserQuestionFormatter 模板
        """
        messages = []

        # 1. 系统提示词
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))

        # 2. 加载历史对话消息（Go 版: GetConversationMessagesByID）
        history_messages = await self._load_conversation_history(conversation_id)

        # 3. RAG 检索（Go 版: GetRankNodes）
        ranked_nodes = []
        rag_service = get_rag_service()
        try:
            # 构建 chat_history（Go 版: historyMessages[:len-1]，排除当前问题）
            chat_history = []
            for msg in history_messages:
                if isinstance(msg, HumanMessage):
                    chat_history.append({"role": "user", "content": msg.content})
                elif isinstance(msg, AIMessage):
                    chat_history.append({"role": "assistant", "content": msg.content})

            rag_result = await rag_service.query_records(
                QueryRecordRequest(
                    dataset_id=dataset_id,
                    query=query,
                    top_k=10,  # Go 版硬编码 TopK: 10
                    score_threshold=0.2,  # Go 版 chat 场景 SimilarityThreshold: 0.2
                    group_ids=group_ids or [],
                    history=chat_history,  # Go 版: HistoryMessages
                )
            )

            if rag_result.chunks:
                # 按 doc_id 聚合 chunk（Go 版: GetRankNodes 逻辑）
                ranked_nodes = await self._build_ranked_nodes(rag_result.chunks, kb_id)

                # 格式化文档上下文（对齐 Go 版 FormatNodeChunks）
                doc_parts = []
                for node in ranked_nodes:
                    doc_parts.append(
                        f"<document>\nID: {node.node_id}\n标题: {node.node_name}\n"
                        f"URL: {node.node_url}\n内容:\n{node.node_content}\n</document>"
                    )
                documents = "\n".join(doc_parts)

                # 用户提示词格式（对齐 Go 版 UserQuestionFormatter）
                user_question = (
                    f"当前日期为：{datetime.now(timezone.utc).strftime('%Y-%m-%d')}。\n\n"
                    f"<question>\n{rag_result.query}\n</question>\n\n"
                    f"<documents>\n{documents}\n</documents>"
                )

                # 添加历史消息到系统提示词之后（Go 版: slices.Insert(formattedMessages, 1, history...)）
                messages.extend(history_messages)
                messages.append(HumanMessage(content=user_question))
            else:
                # 无 RAG 结果，直接使用历史+当前问题
                messages.extend(history_messages)
                messages.append(HumanMessage(content=query))
        except Exception as e:
            logger.warning(f"RAG query failed, using direct query: {e}")
            messages.extend(history_messages)
            messages.append(HumanMessage(content=query))

        return messages, ranked_nodes

    async def _load_conversation_history(self, conversation_id: str) -> list:
        """加载对话历史消息 - 对应 Go 版加载历史对话逻辑"""
        if not conversation_id:
            return []

        result = await self.db.execute(
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conversation_id)
            .order_by(ConversationMessage.created_at)
        )
        history = list(result.scalars().all())

        messages = []
        for msg in history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))

        # 移除最后一条用户消息（当前问题），避免重复
        # Go 版逻辑：历史消息排除最后一条（即当前问题），当前问题由 RAG 上下文构建
        if messages and isinstance(messages[-1], HumanMessage):
            messages.pop()

        return messages

    async def _build_ranked_nodes(self, chunks, kb_id: str = "") -> list:
        """构建排序后的节点列表 - 对应 Go 版 GetRankNodes

        Go 版逻辑：
        1. 从 RAG 结果提取 doc_ids
        2. 调用 GetNodeReleasesWithPathsByDocIDs 获取节点元信息（按 doc_id 匹配）
        3. 按 doc_id 聚合 chunk
        4. 返回 RankedNodeChunks 列表
        """
        # 提取所有 doc_id（Go 版: lo.Uniq(lo.Map(records, DocID))）
        doc_ids = list({chunk.doc_id for chunk in chunks if chunk.doc_id})

        # 通过 doc_id 从 node_releases 查节点元信息（Go 版: GetNodeReleasesWithPathsByDocIDs）
        node_release_map: dict[str, dict] = {}
        if doc_ids:
            try:
                result = await self.db.execute(
                    select(NodeRelease).where(
                        NodeRelease.doc_id.in_(doc_ids),
                        NodeRelease.kb_id == kb_id,
                    )
                )
                releases = result.scalars().all()
                for release in releases:
                    node_release_map[release.doc_id] = {
                        "node_id": release.node_id,
                        "name": release.name,
                        "meta": release.meta or {},
                    }
            except Exception as e:
                logger.warning(f"Failed to get node releases by doc_ids: {e}")

        # 按 doc_id 聚合 chunk（Go 版: rankedNodesMap 逻辑）
        node_map: dict[str, dict] = {}
        for chunk in chunks:
            doc_id = chunk.doc_id
            if doc_id not in node_map:
                # 从 node_release 获取元信息
                release_info = node_release_map.get(doc_id, {})
                node_id = release_info.get("node_id", doc_id)
                meta = release_info.get("meta", {})

                node_map[doc_id] = {
                    "node_id": node_id,
                    "node_name": release_info.get("name", chunk.node_name),
                    "node_url": chunk.url or "",
                    "node_summary": meta.get("summary", ""),
                    "node_emoji": meta.get("emoji", ""),
                    "node_path_names": [],
                    "node_content": chunk.content,
                    "score": chunk.score,
                }
            else:
                node_map[doc_id]["node_content"] += f"\n{chunk.content}"
                node_map[doc_id]["score"] = max(node_map[doc_id]["score"], chunk.score)

        # 尝试从数据库补充节点元信息（emoji/summary 在 node.meta 中）
        for doc_id, node_data in node_map.items():
            if not node_data["node_summary"] and node_data["node_id"] != doc_id:
                try:
                    node = await self.node_repo.get_by_id(node_data["node_id"])
                    if node:
                        meta = node.meta or {}
                        if not node_data["node_summary"]:
                            node_data["node_summary"] = meta.get("summary", "")
                        if not node_data["node_emoji"]:
                            node_data["node_emoji"] = meta.get("emoji", "")
                except Exception:
                    pass

        # 转为简单对象列表
        from types import SimpleNamespace
        result = []
        for node_data in node_map.values():
            result.append(SimpleNamespace(**node_data))

        # 按分数降序
        result.sort(key=lambda x: x.score, reverse=True)
        return result

    @staticmethod
    def _parse_messages(raw_messages: list) -> list:
        """解析 OpenAI 格式消息列表为 LangChain 消息"""
        lc_messages = []
        for msg in raw_messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                lc_messages.append(SystemMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
            else:
                lc_messages.append(HumanMessage(content=content))
        return lc_messages
