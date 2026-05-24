"""LangChain RAG 实现 - 对应 Go 版 store/rag/ct.go"""

import os
from typing import Any, Optional

from loguru import logger

from app.core.config import settings
from app.infrastructure.rag.base import (
    ModelInfo,
    QueryRecordRequest,
    QueryRecordResponse,
    RAGService,
    RankedNodeChunk,
    UpsertRecordRequest,
)


class LangChainRAG(RAGService):
    """基于 LangChain + Chroma 的 RAG 实现"""

    def __init__(self):
        self._vectorstore = None
        self._embedding = None
        self._initialized = False
        self._collections: dict[str, Any] = {}  # dataset_id -> vectorstore
        self._models: dict[str, ModelInfo] = {}  # model_id -> ModelInfo

    def _ensure_initialized(self):
        """延迟初始化 LangChain 组件"""
        if self._initialized:
            return

        try:
            from langchain_openai import OpenAIEmbeddings
            self._embedding = OpenAIEmbeddings(
                model=settings.EMBEDDING_MODEL,
                openai_api_key=settings.OPENAI_API_KEY,
            )
            self._initialized = True
            logger.info("LangChain RAG initialized with Chroma backend")
        except Exception as e:
            logger.error(f"LangChain RAG init failed: {e}")

    async def create_knowledge_base(self, name: str) -> str:
        """创建知识库 - 创建 Chroma Collection"""
        self._ensure_initialized()
        dataset_id = name.lower().replace(" ", "_")

        try:
            import chromadb
            client = chromadb.PersistentClient(path=os.path.join(settings.DATA_DIR if hasattr(settings, 'DATA_DIR') else "/tmp", "chroma"))
            collection = client.get_or_create_collection(
                name=dataset_id,
                metadata={"hnsw:space": "cosine"},
            )
            self._collections[dataset_id] = collection
            logger.info(f"Created knowledge base: {dataset_id}")
        except Exception as e:
            logger.error(f"Failed to create knowledge base {name}: {e}")

        return dataset_id

    async def upsert_records(self, req: UpsertRecordRequest) -> str:
        """上传文档到知识库"""
        self._ensure_initialized()

        try:
            from langchain_core.documents import Document
            from langchain_text_splitters import RecursiveCharacterTextSplitter

            # 分块
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
            )
            docs = text_splitter.create_documents(
                texts=[req.content],
                metadatas=[{
                    "node_id": req.doc_id,
                    "node_name": req.name,
                    "group_ids": ",".join(req.group_ids) if req.group_ids else "",
                    "tags": ",".join(req.tags) if req.tags else "",
                }],
            )

            # 获取或创建 vectorstore
            from langchain_community.vectorstores import Chroma
            vectorstore = Chroma(
                collection_name=req.dataset_id,
                embedding_function=self._embedding,
                persist_directory=os.path.join(
                    settings.DATA_DIR if hasattr(settings, 'DATA_DIR') else "/tmp", "chroma"
                ),
            )

            # 添加文档
            ids = [f"{req.doc_id}_{i}" for i in range(len(docs))]
            vectorstore.add_documents(docs, ids=ids)

            logger.info(f"Upserted {len(docs)} chunks for doc {req.doc_id} to {req.dataset_id}")
            return req.doc_id
        except Exception as e:
            logger.error(f"Upsert records failed: {e}")
            return req.doc_id

    async def query_records(self, req: QueryRecordRequest) -> QueryRecordResponse:
        """检索文档 - 语义搜索 + rerank"""
        self._ensure_initialized()

        try:
            from langchain_community.vectorstores import Chroma
            vectorstore = Chroma(
                collection_name=req.dataset_id,
                embedding_function=self._embedding,
                persist_directory=os.path.join(
                    settings.DATA_DIR if hasattr(settings, 'DATA_DIR') else "/tmp", "chroma"
                ),
            )

            # 构建过滤条件
            filter_dict = {}
            if req.group_ids:
                # Chroma where filter
                filter_dict = {"group_ids": {"$in": req.group_ids}}

            # 相似度搜索
            results = vectorstore.similarity_search_with_score(
                query=req.query,
                k=req.top_k,
                filter=filter_dict if filter_dict else None,
            )

            chunks = []
            for doc, score in results:
                metadata = doc.metadata or {}
                chunk = RankedNodeChunk(
                    chunk_id=metadata.get("node_id", ""),  # LangChain 无 chunk_id
                    node_id=metadata.get("node_id", ""),
                    node_name=metadata.get("node_name", ""),
                    content=doc.page_content,
                    score=float(score),
                    doc_id=metadata.get("node_id", ""),
                    url="",
                )
                chunks.append(chunk)

            # 按分数排序（降序）
            chunks.sort(key=lambda x: x.score, reverse=True)

            return QueryRecordResponse(chunks=chunks, query=req.query)
        except Exception as e:
            logger.error(f"Query records failed: {e}")
            return QueryRecordResponse(chunks=[], query=req.query)

    async def delete_records(self, dataset_id: str, doc_ids: list[str]) -> None:
        """删除文档"""
        try:
            from langchain_community.vectorstores import Chroma
            vectorstore = Chroma(
                collection_name=dataset_id,
                embedding_function=self._embedding,
                persist_directory=os.path.join(
                    settings.DATA_DIR if hasattr(settings, 'DATA_DIR') else "/tmp", "chroma"
                ),
            )
            # 删除以 doc_id 开头的所有 chunks
            for doc_id in doc_ids:
                vectorstore.delete(filter={"node_id": doc_id})
            logger.info(f"Deleted records: {doc_ids} from {dataset_id}")
        except Exception as e:
            logger.error(f"Delete records failed: {e}")

    async def delete_knowledge_base(self, dataset_id: str) -> None:
        """删除知识库 - 删除 Collection"""
        try:
            import chromadb
            client = chromadb.PersistentClient(path=os.path.join(
                settings.DATA_DIR if hasattr(settings, 'DATA_DIR') else "/tmp", "chroma"
            ))
            client.delete_collection(name=dataset_id)
            self._collections.pop(dataset_id, None)
            logger.info(f"Deleted knowledge base: {dataset_id}")
        except Exception as e:
            logger.warning(f"Delete knowledge base failed (may not exist): {e}")

    async def update_document_group_ids(
        self, dataset_id: str, doc_id: str, group_ids: list[int]
    ) -> None:
        """更新文档分组ID"""
        # Chroma 不直接支持 metadata 更新，需要删除后重新添加
        logger.info(f"Update group IDs for {doc_id}: {group_ids} (re-upsert required)")

    async def list_documents(
        self, dataset_id: str, document_ids: Optional[list[str]] = None
    ) -> list[dict[str, Any]]:
        """列出文档"""
        try:
            import chromadb
            client = chromadb.PersistentClient(path=os.path.join(
                settings.DATA_DIR if hasattr(settings, 'DATA_DIR') else "/tmp", "chroma"
            ))
            collection = client.get_collection(name=dataset_id)
            results = collection.get()
            docs = []
            for i, doc_id in enumerate(results["ids"]):
                if document_ids and doc_id not in document_ids:
                    continue
                metadata = results["metadatas"][i] if results["metadatas"] else {}
                docs.append({
                    "id": doc_id,
                    "metadata": metadata,
                })
            return docs
        except Exception as e:
            logger.error(f"List documents failed: {e}")
            return []

    async def get_model_list(self) -> list[ModelInfo]:
        """获取模型列表"""
        return list(self._models.values())

    async def add_model(self, model: ModelInfo) -> str:
        """添加模型"""
        self._models[model.id] = model
        return model.id

    async def update_model(self, model: ModelInfo) -> None:
        """更新模型"""
        self._models[model.id] = model

    async def upsert_model(self, model: ModelInfo) -> str:
        """创建或更新模型"""
        self._models[model.id] = model
        return model.id

    async def delete_model(self, model_id: str) -> None:
        """删除模型"""
        self._models.pop(model_id, None)
