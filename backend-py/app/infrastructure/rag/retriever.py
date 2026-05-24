"""RAG 检索器"""

from typing import Optional

from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever

from app.infrastructure.rag.base import QueryRecordRequest, get_rag_service


class PandaWikiRetriever(BaseRetriever):
    """PandaWiki 自定义检索器 - 对应 Go 版的 RAG 查询"""

    dataset_id: str = ""
    top_k: int = 5
    score_threshold: float = 0.5
    group_ids: list[str] = []

    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: Optional[CallbackManagerForRetrieverRun] = None,
    ) -> list[Document]:
        """检索相关文档"""
        # 同步包装 - 实际使用时需要 async 版本
        return []

    async def aretrieve(self, query: str) -> list[Document]:
        """异步检索"""
        rag_service = get_rag_service()
        req = QueryRecordRequest(
            dataset_id=self.dataset_id,
            query=query,
            top_k=self.top_k,
            score_threshold=self.score_threshold,
            group_ids=self.group_ids,
        )
        response = await rag_service.query_records(req)
        return [
            Document(
                page_content=chunk.content,
                metadata={
                    "node_id": chunk.node_id,
                    "node_name": chunk.node_name,
                    "score": chunk.score,
                    "doc_id": chunk.doc_id,
                },
            )
            for chunk in response.chunks
        ]
