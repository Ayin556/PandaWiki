"""RAG 服务接口定义 - 对应 Go 版 store/rag/rag.go"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional

from app.core.constants import ModelType


@dataclass
class RankedNodeChunk:
    """排序后的节点块 - 对齐 Go 版 domain.NodeContentChunk"""
    chunk_id: str  # Go 版: chunk.ChunkID
    node_id: str   # Go 版: chunk.DocumentID (用作 node 查找键)
    node_name: str
    content: str
    score: float = 0.0
    doc_id: str = ""  # Go 版: chunk.DocumentID
    url: str = ""


@dataclass
class UpsertRecordRequest:
    """上传文档请求 - 对齐 Go 版 rag.UpsertRecordsRequest"""
    dataset_id: str
    doc_id: str
    name: str
    content: str
    id: str = ""  # Go 版的 ID 字段，用于文件名 {id}.md
    group_ids: list[int] = field(default_factory=list)  # Go 版为 []int
    tags: list[str] = field(default_factory=list)


@dataclass
class QueryRecordRequest:
    """检索请求 - 对齐 Go 版 rag.QueryRecordsRequest"""
    dataset_id: str
    query: str
    top_k: int = 10  # Go 版硬编码为 10
    score_threshold: float = 0.2  # Go 版 chat 场景传 0.2
    group_ids: list[int] = field(default_factory=list)  # Go 版为 []int
    history: list[dict[str, str]] = field(default_factory=list)  # chat_history
    tags: list[str] = field(default_factory=list)  # Go 版传 tags
    max_chunks_per_doc: int = 0  # Go 版传 MaxChunksPerDoc


@dataclass
class QueryRecordResponse:
    """检索响应"""
    chunks: list[RankedNodeChunk]
    query: str


@dataclass
class ModelInfo:
    """模型信息 - 对齐 Go 版 domain.Model"""
    id: str
    name: str
    type: str
    provider: str
    base_url: str
    api_key: str
    api_header: str = ""
    api_version: str = ""
    max_tokens: int = 8192
    extra_parameters: dict = field(default_factory=dict)
    is_default: bool = True
    is_active: bool = True


class RAGService(ABC):
    """RAG 服务抽象接口 - 对应 Go 版 rag.RAGService"""

    @abstractmethod
    async def create_knowledge_base(self, name: str) -> str:
        """创建知识库(数据集)，返回 dataset_id"""
        ...

    @abstractmethod
    async def upsert_records(self, req: UpsertRecordRequest) -> str:
        """上传文档到知识库，返回 document_id"""
        ...

    @abstractmethod
    async def query_records(self, req: QueryRecordRequest) -> QueryRecordResponse:
        """检索知识库文档"""
        ...

    @abstractmethod
    async def delete_records(self, dataset_id: str, doc_ids: list[str]) -> None:
        """删除知识库文档"""
        ...

    @abstractmethod
    async def delete_knowledge_base(self, dataset_id: str) -> None:
        """删除知识库(数据集)"""
        ...

    @abstractmethod
    async def update_document_group_ids(
        self, dataset_id: str, doc_id: str, group_ids: list[int]
    ) -> None:
        """更新文档分组ID - Go 版 groupIds 类型为 []int"""
        ...

    @abstractmethod
    async def list_documents(
        self, dataset_id: str, document_ids: Optional[list[str]] = None
    ) -> list[dict[str, Any]]:
        """列出文档"""
        ...

    # 模型管理
    @abstractmethod
    async def get_model_list(self) -> list[ModelInfo]:
        """获取模型列表"""
        ...

    @abstractmethod
    async def add_model(self, model: ModelInfo) -> str:
        """添加模型"""
        ...

    @abstractmethod
    async def update_model(self, model: ModelInfo) -> None:
        """更新模型"""
        ...

    @abstractmethod
    async def upsert_model(self, model: ModelInfo) -> str:
        """创建或更新模型"""
        ...

    @abstractmethod
    async def delete_model(self, model_id: str) -> None:
        """删除模型"""
        ...


_rag_service: RAGService | None = None


def get_rag_service() -> RAGService:
    """获取 RAG 服务单例

    优先使用 CT RAG (raglite HTTP 服务)，与 Go 版保持一致。
    仅当 RAG_BASE_URL 未配置时回退到本地 LangChain/Chroma。
    """
    global _rag_service
    if _rag_service is not None:
        return _rag_service

    from app.core.config import settings

    if settings.RAG_BASE_URL:
        from app.infrastructure.rag.ct_rag import CTRAGService
        _rag_service = CTRAGService()
    else:
        from app.infrastructure.rag.langchain_rag import LangChainRAG
        _rag_service = LangChainRAG()

    return _rag_service
