"""向量存储管理"""

from typing import Any, Optional

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from app.core.config import settings


class VectorStoreManager:
    """向量存储管理器

    支持 ChromaDB / Qdrant / PGVector 后端
    """

    def __init__(self, backend: str = "chroma"):
        self._backend = backend
        self._stores: dict[str, Any] = {}

    def _get_store(self, collection_name: str, embedding: Embeddings) -> Any:
        """获取或创建向量存储"""
        if collection_name in self._stores:
            return self._stores[collection_name]

        if self._backend == "chroma":
            from langchain_chroma import Chroma
            store = Chroma(
                collection_name=collection_name,
                embedding_function=embedding,
                persist_directory=f"./data/chroma/{collection_name}",
            )
        else:
            raise ValueError(f"Unsupported vector store backend: {self._backend}")

        self._stores[collection_name] = store
        return store

    async def add_documents(
        self,
        collection_name: str,
        documents: list[Document],
        embedding: Embeddings,
    ) -> list[str]:
        """添加文档到向量存储"""
        store = self._get_store(collection_name, embedding)
        ids = await store.aadd_documents(documents)
        return ids

    async def similarity_search(
        self,
        collection_name: str,
        query: str,
        embedding: Embeddings,
        top_k: int = 5,
    ) -> list[Document]:
        """相似度搜索"""
        store = self._get_store(collection_name, embedding)
        results = await store.asimilarity_search(query, k=top_k)
        return results

    async def delete_documents(
        self,
        collection_name: str,
        doc_ids: list[str],
        embedding: Embeddings,
    ) -> None:
        """删除文档"""
        store = self._get_store(collection_name, embedding)
        store.delete(ids=doc_ids)


vector_store_manager = VectorStoreManager()
