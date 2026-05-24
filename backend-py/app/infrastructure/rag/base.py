"""RAG 服务接口定义 - 对应 Go 版 store/rag/rag.go"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional

from app.core.constants import ModelType


@dataclass
class RankedNodeChunk:
    """排序后的节点块"""
    node_id: str
    node_name: str
    content: str
    score: float = 0.0
    doc_id: str = ""
    url: str = ""


@dataclass
class UpsertRecordRequest:
    """上传文档请求"""
    dataset_id: str
    doc_id: str
    name: str
    content: str
    group_ids: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)


@dataclass
class QueryRecordRequest:
    """检索请求"""
    dataset_id: str
    query: str
    top_k: int = 5
    score_threshold: float = 0.5
    group_ids: list[str] = field(default_factory=list)
    history: list[dict[str, str]] = field(default_factory=list)


@dataclass
class QueryRecordResponse:
    """检索响应"""
    chunks: list[RankedNodeChunk]
    query: str


@dataclass
class ModelInfo:
    """模型信息"""
    id: str
    name: str
    type: str
    provider: str
    base_url: str
    api_key: str


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
        self, dataset_id: str, doc_id: str, group_ids: list[str]
    ) -> None:
        """更新文档分组ID"""
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
    """获取 RAG 服务单例"""
    global _rag_service
    if _rag_service is None:
        from app.infrastructure.rag.langchain_rag import LangChainRAG
        _rag_service = LangChainRAG()
    return _rag_service
