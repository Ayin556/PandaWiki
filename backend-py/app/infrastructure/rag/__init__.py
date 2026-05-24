"""RAG 检索增强生成服务

优先使用 CT RAG (raglite) HTTP 服务（与 Go 版一致），
仅当 RAG_BASE_URL 未配置时回退到本地 LangChain/Chroma 实现。
"""

from app.infrastructure.rag.base import RAGService, get_rag_service
from app.infrastructure.rag.ct_rag import CTRAGService

__all__ = ["RAGService", "get_rag_service", "CTRAGService"]
