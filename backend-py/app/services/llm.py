"""LLM 服务 - 对应 Go 版 usecase/llm.go

基于 LangChain 的 LLM 服务，核心功能：
1. RAG 检索 + 对话构建
2. 流式/非流式推理
3. 文档摘要生成
4. Token 分块
"""

from typing import AsyncGenerator, Optional

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_openai import ChatOpenAI

from app.core.config import settings
from app.infrastructure.rag import get_rag_service
from app.infrastructure.rag.base import QueryRecordRequest


class LLMService:
    """LLM 业务逻辑 - 基于 LangChain"""

    def __init__(self):
        self._chat_model = None

    def _get_chat_model(self, model_name: str = "", streaming: bool = False) -> ChatOpenAI:
        """获取聊天模型"""
        return ChatOpenAI(
            model=model_name or settings.CHAT_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
            streaming=streaming,
            temperature=0.7,
        )

    async def build_conversation_with_rag(
        self,
        kb_id: str,
        conversation_id: str,
        query: str,
        system_prompt: str = "",
        group_ids: list[str] = None,
    ) -> list:
        """构建带RAG的对话消息 - 对应 Go 版 BuildConversationMessageWithRAG"""
        messages = []

        # 系统提示词
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))

        # RAG 检索
        rag_service = get_rag_service()
        rag_result = await rag_service.query_records(
            QueryRecordRequest(
                dataset_id=kb_id,
                query=query,
                group_ids=group_ids or [],
            )
        )

        # 构建上下文
        if rag_result.chunks:
            context = "\n\n".join([f"### {c.node_name}\n{c.content}" for c in rag_result.chunks])
            messages.append(SystemMessage(content=f"参考资料:\n{context}"))

        # 用户消息
        messages.append(HumanMessage(content=query))
        return messages

    async def chat_with_agent(
        self,
        messages: list,
        model_name: str = "",
        on_chunk=None,
    ) -> str:
        """流式 LLM 推理 - 对应 Go 版 ChatWithAgent"""
        model = self._get_chat_model(model_name, streaming=on_chunk is not None)

        if on_chunk:
            full_content = ""
            async for chunk in model.astream(messages):
                content = chunk.content
                full_content += content
                if on_chunk:
                    await on_chunk(content)
            return full_content
        else:
            response = await model.ainvoke(messages)
            return response.content

    async def generate(
        self,
        messages: list,
        model_name: str = "",
    ) -> str:
        """非流式 LLM 推理 - 对应 Go 版 Generate"""
        model = self._get_chat_model(model_name, streaming=False)
        response = await model.ainvoke(messages)
        return response.content

    async def summary_node(
        self,
        kb_id: str,
        model_name: str,
        node_name: str,
        content: str,
    ) -> str:
        """文档摘要生成 (非流式) - 对应 Go 版 SummaryNode"""
        # 分块
        chunks = self.split_by_token_limit(content, 30720)

        # 逐块摘要
        summaries = []
        for chunk in chunks:
            messages = [
                SystemMessage(content="请对以下文档内容生成简洁的摘要，保留关键信息。"),
                HumanMessage(content=f"文档名称: {node_name}\n\n内容:\n{chunk}"),
            ]
            summary = await self.generate(messages, model_name)
            summaries.append(summary)

        # 合并摘要
        if len(summaries) == 1:
            return summaries[0]

        combined = "\n\n".join(summaries)
        messages = [
            SystemMessage(content="请将以下多个摘要合并为一个完整的摘要。"),
            HumanMessage(content=combined),
        ]
        return await self.generate(messages, model_name)

    async def stream_summary_node(
        self,
        kb_id: str,
        model_name: str,
        node_name: str,
        content: str,
    ) -> AsyncGenerator[str, None]:
        """流式文档摘要生成 - 对应 Go 版 StreamSummaryNode"""
        chunks = self.split_by_token_limit(content, 30720)

        if len(chunks) <= 1:
            # 单块直接流式输出
            messages = [
                SystemMessage(content="请对以下文档内容生成简洁的摘要，保留关键信息。"),
                HumanMessage(content=f"文档名称: {node_name}\n\n内容:\n{content}"),
            ]
            model = self._get_chat_model(model_name, streaming=True)
            async for chunk in model.astream(messages):
                yield chunk.content
        else:
            # 多块先逐块非流式摘要再流式输出最终摘要
            summaries = []
            for chunk_content in chunks:
                messages = [
                    SystemMessage(content="请对以下文档内容生成简洁的摘要。"),
                    HumanMessage(content=f"内容:\n{chunk_content}"),
                ]
                summary = await self.generate(messages, model_name)
                summaries.append(summary)

            combined = "\n\n".join(summaries)
            messages = [
                SystemMessage(content="请将以下多个摘要合并为一个完整的摘要。"),
                HumanMessage(content=combined),
            ]
            model = self._get_chat_model(model_name, streaming=True)
            async for chunk in model.astream(messages):
                yield chunk.content

    @staticmethod
    def split_by_token_limit(text: str, max_tokens: int) -> list[str]:
        """按 Token 数量分块 - 对应 Go 版 SplitByTokenLimit"""
        try:
            import tiktoken
            enc = tiktoken.get_encoding("cl100k_base")
            tokens = enc.encode(text)
            chunks = []
            for i in range(0, len(tokens), max_tokens):
                chunk_tokens = tokens[i:i + max_tokens]
                chunks.append(enc.decode(chunk_tokens))
            return chunks if chunks else [text]
        except Exception:
            # 回退: 按字符数分块
            char_limit = max_tokens * 4  # 粗略估计
            chunks = []
            for i in range(0, len(text), char_limit):
                chunks.append(text[i:i + char_limit])
            return chunks if chunks else [text]

    async def get_rank_nodes(self, kb_id: str, query: str, top_k: int = 5, group_ids: list = None) -> list:
        """RAG 检索 - 对应 Go 版 GetRankNodes"""
        rag_service = get_rag_service()
        result = await rag_service.query_records(
            QueryRecordRequest(
                dataset_id=kb_id,
                query=query,
                top_k=top_k,
                group_ids=group_ids or [],
            )
        )
        return result.chunks


# 全局单例
llm_service = LLMService()
