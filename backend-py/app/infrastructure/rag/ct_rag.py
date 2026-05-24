"""CT RAG (raglite) HTTP 客户端实现 - 对应 Go 版 store/rag/ct.go

通过 HTTP API 调用 raglite 外部服务，与 Go 版使用完全相同的 RAG 后端。
"""

import io
import json
from typing import Any, Optional

import httpx
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


class CTRAGService(RAGService):
    """CT RAG 服务 - 通过 HTTP API 调用 raglite 服务

    对应 Go 版 store/rag/ct.go，使用相同的 raglite HTTP API。
    Base URL 从 settings.RAG_BASE_URL 读取。
    """

    def __init__(self):
        # RAG_BASE_URL 指向 raglite 服务根地址，如 http://localhost:5050
        # 所有 API 路径均包含 /api/v1 前缀，与 raglite-go-sdk v0.2.1 一致
        self._base_url = (settings.RAG_BASE_URL or "").rstrip("/")
        self._api_key = getattr(settings, "RAG_CT_API_KEY", "") or ""
        # 默认请求头（对应 Go 版 raglite SDK 的认证方式）
        self._headers = {
            "X-API-Version": "1.0.0",
            "X-App-Name": "Panda-Wiki",
        }
        if self._api_key:
            self._headers["Authorization"] = f"Bearer {self._api_key}"

    def _get_client(self) -> httpx.AsyncClient:
        """获取异步 HTTP 客户端"""
        return httpx.AsyncClient(
            timeout=60.0,
        )

    async def _request(self, method: str, path: str, json_data: dict = None) -> dict:
        """发送 JSON HTTP 请求到 RAG 服务

        path 应为以 /api/v1 开头的完整路径，如 /api/v1/search
        URL 拼接方式与 raglite-go-sdk 一致：baseURL + path
        """
        url = f"{self._base_url}{path}"
        async with self._get_client() as client:
            response = await client.request(method, url, json=json_data, headers=self._headers)
            response.raise_for_status()
            data = response.json()
            if data.get("code", 0) != 0:
                raise ValueError(f"RAG service error: {data.get('message', 'unknown')}")
            return data.get("data", data)

    async def _multipart_request(self, method: str, path: str, files: dict = None, data: dict = None) -> dict:
        """发送 multipart/form-data 请求到 RAG 服务

        用于文档上传等需要 multipart 的接口，对应 raglite-go-sdk v0.2.1 DocumentsService.Upload
        """
        url = f"{self._base_url}{path}"
        async with self._get_client() as client:
            response = await client.request(
                method, url, files=files, data=data,
                headers=self._headers,
            )
            response.raise_for_status()
            resp_data = response.json()
            if resp_data.get("code", 0) != 0:
                raise ValueError(f"RAG service error: {resp_data.get('message', 'unknown')}")
            return resp_data.get("data", resp_data)

    # ==================== 知识库操作 ====================

    async def create_knowledge_base(self, name: str = "") -> str:
        """创建数据集 - 对应 Go 版 CTRAG.CreateKnowledgeBase

        Go 版使用 uuid.New().String() 作为 name，与 Python 版调用者传入的 name 不同。
        为了兼容性，如果 name 为空则自动生成 UUID。
        """
        import uuid as uuid_mod
        dataset_name = name or uuid_mod.uuid4().hex
        try:
            result = await self._request("POST", "/api/v1/datasets", {"name": dataset_name})
            return result.get("id", "")
        except Exception as e:
            logger.error(f"Create knowledge base failed: {e}")
            raise

    async def delete_knowledge_base(self, dataset_id: str) -> None:
        """删除数据集 - 对应 Go 版 CTRAG.DeleteKnowledgeBase"""
        try:
            await self._request("DELETE", f"/api/v1/datasets/{dataset_id}")
        except httpx.HTTPStatusError as e:
            if e.response.status_code != 404:
                raise
            logger.warning(f"Dataset {dataset_id} not found, skip deletion")

    # ==================== 文档操作 ====================

    async def upsert_records(self, req: UpsertRecordRequest) -> str:
        """上传文档 - 对应 Go 版 CTRAG.UpsertRecords

        raglite 的文档上传 API 要求 multipart/form-data 格式，
        对应 raglite-go-sdk v0.2.1 DocumentsService.Upload 方法。

        关键对齐点（与 Go 版 UpsertRecords 一致）：
        - 文件名格式: {req.id}.md（Go 版用 req.ID 字段命名）
        - metadata: {"group_ids": req.group_ids}（Go 版为 []int）
        - 如内容为 HTML，先转为 Markdown（Go 版有 IsLikelyHTML + ConvertString）
        """
        try:
            # HTML → Markdown 转换（对应 Go 版 utils.IsLikelyHTML + mdConv.ConvertString）
            content = req.content
            if self._is_likely_html(content):
                content = self._html_to_markdown(content)

            # 准备文件内容（Go 版: fmt.Sprintf("%s.md", req.ID)）
            file_id = req.id or req.doc_id
            filename = f"{file_id}.md"
            file_content = io.BytesIO(content.encode("utf-8"))

            # 构建 multipart form data
            files = {
                "file": (filename, file_content, "text/markdown"),
            }

            # 添加可选字段（对齐 raglite-go-sdk UploadDocumentRequest）
            form_data = {}
            if req.doc_id:
                form_data["document_id"] = req.doc_id
            if req.name:
                form_data["title"] = req.name
            # Go 版: data.Metadata["group_ids"] = req.GroupIDs ([]int)
            if req.group_ids:
                form_data["metadata"] = json.dumps({"group_ids": req.group_ids})
            # Go 版: data.Tags = req.Tags
            if req.tags:
                form_data["tags"] = json.dumps(req.tags)

            result = await self._multipart_request(
                "POST",
                f"/api/v1/datasets/{req.dataset_id}/documents",
                files=files,
                data=form_data,
            )

            doc_id = result.get("document_id", req.doc_id)
            logger.info(f"Upserted document {doc_id} to dataset {req.dataset_id}")
            return doc_id
        except Exception as e:
            logger.error(f"Upsert records failed: {e}")
            raise

    async def query_records(self, req: QueryRecordRequest) -> QueryRecordResponse:
        """检索文档 - 对应 Go 版 CTRAG.QueryRecords

        核心接口：通过 raglite 的 /api/v1/search 端点进行向量/关键词检索。
        支持基于聊天历史的 query rewrite。

        请求格式对齐 raglite-go-sdk v0.2.1 SearchService.Retrieve()
        关键参数对齐 Go 版 GetRankNodes 调用：
        - TopK: 10（Go 版硬编码）
        - SimilarityThreshold: 0.2（Go 版 chat 场景）
        - ChatHistory: 对话历史用于 query rewrite
        - Metadata: {"group_ids": req.GroupIDs}
        - Tags: 过滤标签
        - MaxChunksPerDoc: 每个文档最多返回的 chunk 数
        """
        if not self._base_url:
            logger.warning("RAG_BASE_URL not configured, returning empty results")
            return QueryRecordResponse(chunks=[], query=req.query)

        try:
            # 构建聊天历史（对齐 Go 版 raglite.ChatMessage 转换）
            chat_history = []
            for msg in req.history:
                role = msg.get("role", "")
                content = msg.get("content", "")
                if role in ("user", "assistant"):
                    chat_history.append({"role": role, "content": content})

            # 请求格式对齐 raglite-go-sdk RetrieveRequest
            payload = {
                "query": req.query,
                "dataset_id": req.dataset_id,
                "top_k": req.top_k or 10,
                "similarity_threshold": req.score_threshold,
                "chat_history": chat_history,
            }

            # Metadata: 对齐 Go 版 Metadata: map[string]interface{}{"group_ids": req.GroupIDs}
            if req.group_ids:
                payload["metadata"] = {"group_ids": req.group_ids}

            # Tags: 对齐 Go 版 Tags: req.Tags
            if req.tags:
                payload["tags"] = req.tags

            # MaxChunksPerDoc: 对齐 Go 版 MaxChunksPerDoc
            if req.max_chunks_per_doc > 0:
                payload["max_chunks_per_doc"] = req.max_chunks_per_doc

            result = await self._request("POST", "/api/v1/search", payload)

            # 解析响应（对齐 Go 版 SearchResponse → NodeContentChunk 转换）
            results_data = result.get("results", [])
            rewritten_query = result.get("query", req.query)

            chunks = []
            for chunk in results_data:
                # Go 版: NodeContentChunk{ID: chunk.ChunkID, Content: chunk.Content, DocID: chunk.DocumentID}
                c = RankedNodeChunk(
                    chunk_id=chunk.get("chunk_id", ""),
                    node_id=chunk.get("document_id", ""),
                    node_name=chunk.get("document_title", "") or chunk.get("section_title", ""),
                    content=chunk.get("content", ""),
                    score=chunk.get("score", 0.0),
                    doc_id=chunk.get("document_id", ""),
                    url="",
                )
                chunks.append(c)

            return QueryRecordResponse(chunks=chunks, query=rewritten_query)

        except Exception as e:
            logger.error(f"Query records failed: {e}")
            return QueryRecordResponse(chunks=[], query=req.query)

    async def delete_records(self, dataset_id: str, doc_ids: list[str]) -> None:
        """删除文档 - 对应 Go 版 CTRAG.DeleteRecords

        对齐 raglite-go-sdk v0.2.1 BatchDeleteDocumentsRequest：
        POST /api/v1/datasets/{dataset_id}/documents/batch-delete
        Body: {"document_ids": [...]}
        """
        try:
            await self._request(
                "POST",
                f"/api/v1/datasets/{dataset_id}/documents/batch-delete",
                {"document_ids": doc_ids},
            )
        except Exception as e:
            logger.error(f"Delete records failed: {e}")

    async def update_document_group_ids(
        self, dataset_id: str, doc_id: str, group_ids: list[int]
    ) -> None:
        """更新文档分组ID - 对应 Go 版 CTRAG.UpdateDocumentGroupIDs

        对齐 raglite-go-sdk v0.2.1 DocumentsService.Update：
        PATCH /api/v1/datasets/{dataset_id}/documents/{doc_id}
        Go 版 groupIds 类型为 []int
        """
        try:
            await self._request(
                "PATCH",
                f"/api/v1/datasets/{dataset_id}/documents/{doc_id}",
                {"metadata": {"group_ids": group_ids}},
            )
        except Exception as e:
            logger.error(f"Update document group IDs failed: {e}")

    async def list_documents(
        self, dataset_id: str, document_ids: Optional[list[str]] = None
    ) -> list[dict[str, Any]]:
        """列出文档 - 对应 Go 版 CTRAG.ListDocuments

        对齐 raglite-go-sdk v0.2.1 DocumentsService.List：
        POST /api/v1/datasets/{dataset_id}/documents/list
        """
        try:
            payload = {"dataset_id": dataset_id}
            if document_ids:
                payload["document_ids"] = document_ids
            result = await self._request(
                "POST",
                f"/api/v1/datasets/{dataset_id}/documents/list",
                payload,
            )
            return result if isinstance(result, list) else result.get("documents", [])
        except Exception as e:
            logger.error(f"List documents failed: {e}")
            return []

    # ==================== 模型管理 ====================

    async def get_model_list(self) -> list[ModelInfo]:
        """获取模型列表 - 对应 Go 版 CTRAG.GetModelList"""
        try:
            result = await self._request("GET", "/api/v1/models")
            models = result if isinstance(result, list) else result.get("models", [])
            return [
                ModelInfo(
                    id=m.get("id", ""),
                    name=m.get("name", ""),
                    type=m.get("type", m.get("model_type", "")),
                    provider=m.get("provider", ""),
                    base_url=m.get("config", {}).get("api_base", ""),
                    api_key=m.get("config", {}).get("api_key", ""),
                    api_header=m.get("config", {}).get("api_header", ""),
                    api_version=m.get("config", {}).get("api_version", ""),
                    max_tokens=m.get("config", {}).get("max_tokens", 8192) or 8192,
                    extra_parameters=m.get("config", {}).get("extra_parameters", {}),
                    is_default=m.get("is_default", True),
                    is_active=m.get("is_active", True),
                )
                for m in models
            ]
        except Exception as e:
            logger.error(f"Get model list failed: {e}")
            return []

    async def add_model(self, model: ModelInfo) -> str:
        """添加模型 - 对应 Go 版 CTRAG.AddModel

        对齐 raglite-go-sdk CreateModelRequest，包含完整 AIModelConfig
        """
        max_tokens = model.max_tokens or 8192
        result = await self._request("POST", "/api/v1/models", {
            "name": model.name,
            "provider": model.provider,
            "model_type": model.type,
            "model_name": model.name,
            "config": {
                "api_base": model.base_url,
                "api_key": model.api_key,
                "api_header": model.api_header,
                "api_version": model.api_version,
                "max_tokens": max_tokens,
                "extra_parameters": model.extra_parameters or {},
            },
            "is_default": model.is_default,
        })
        return result.get("id", "")

    async def update_model(self, model: ModelInfo) -> None:
        """更新模型 - 对应 Go 版 CTRAG.UpdateModel

        对齐 raglite-go-sdk UpdateModelRequest，字段为指针类型（可选更新）
        """
        max_tokens = model.max_tokens or 8192
        await self._request("PUT", f"/api/v1/models/{model.id}", {
            "name": model.name,
            "provider": model.provider,
            "model_name": model.name,
            "config": {
                "api_base": model.base_url,
                "api_key": model.api_key,
                "api_header": model.api_header,
                "api_version": model.api_version,
                "max_tokens": max_tokens,
                "extra_parameters": model.extra_parameters or {},
            },
            "is_default": model.is_default,
            "is_active": model.is_active,
        })

    async def upsert_model(self, model: ModelInfo) -> str:
        """创建或更新模型 - 对应 Go 版 CTRAG.UpsertModel

        对齐 raglite-go-sdk UpsertModelRequest
        """
        max_tokens = model.max_tokens or 8192
        result = await self._request("POST", "/api/v1/models/upsert", {
            "name": model.name,
            "provider": model.provider,
            "model_name": model.name,
            "model_type": model.type,
            "config": {
                "api_base": model.base_url,
                "api_key": model.api_key,
                "api_header": model.api_header,
                "api_version": model.api_version,
                "max_tokens": max_tokens,
                "extra_parameters": model.extra_parameters or {},
            },
            "is_default": model.is_default,
            "is_active": model.is_active,
        })
        return result.get("id", "")

    async def delete_model(self, model_id: str) -> None:
        """删除模型 - 对应 Go 版 CTRAG.DeleteModel"""
        await self._request("DELETE", f"/api/v1/models/{model_id}")

    # ==================== HTML→Markdown 转换 ====================

    @staticmethod
    def _is_likely_html(content: str) -> bool:
        """检测内容是否为 HTML - 对应 Go 版 utils.IsLikelyHTML"""
        if not content:
            return False
        stripped = content.strip()
        # 简单检测：以 < 开头且包含 HTML 标签特征
        if stripped.startswith("<") and ("</" in stripped or "/>" in stripped):
            # 排除 Markdown 中的标签（如 <br>）
            html_tags = ["<html", "<body", "<div", "<p>", "<span", "<table", "<h1", "<h2", "<h3"]
            return any(tag in stripped.lower() for tag in html_tags)
        return False

    @staticmethod
    def _html_to_markdown(content: str) -> str:
        """HTML 转 Markdown - 对应 Go 版 NewHTML2MDConverter().ConvertString()

        使用 markdownify 库进行转换，如果未安装则做基础替换。
        """
        try:
            import markdownify
            return markdownify.markdownify(content, heading_style="ATX", strip=["img"])
        except ImportError:
            # 降级处理：基础 HTML → 文本
            import re
            text = re.sub(r'<br\s*/?>', '\n', content)
            text = re.sub(r'<p\s*/?>', '\n', text)
            text = re.sub(r'</p>', '\n', text)
            text = re.sub(r'<[^>]+>', '', text)
            return text.strip()
