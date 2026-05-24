"""文档节点服务 - 对应 Go 版 usecase/node.go"""

import json
from typing import AsyncGenerator, Optional

from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node import Node, NodeRelease, NodeAuthGroup
from app.repositories.node import NodeRepository
from app.repositories.nav import NavRepository
from app.services.llm import llm_service
from app.infrastructure.rag import get_rag_service
from app.infrastructure.rag.base import UpsertRecordRequest


class NodeService:
    """文档节点业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NodeRepository(db)
        self.nav_repo = NavRepository(db)

    async def create_node(self, req, user_id: str) -> str:
        """创建节点"""
        return await self.repo.create(req, user_id)

    async def get_node_list(self, **kwargs) -> list:
        """获取节点列表"""
        return await self.repo.get_list(**kwargs)

    async def get_node_list_group_nav(self, **kwargs) -> dict:
        """按栏目分组获取节点列表"""
        kb_id = kwargs.get("kb_id", "")
        search = kwargs.get("search", "")

        # 获取所有栏目
        navs = await self.nav_repo.get_list(kb_id)
        # 获取所有节点
        nodes = await self.repo.get_list(kb_id=kb_id, search=search)

        # 按栏目分组
        nav_map = {nav.id: {"id": nav.id, "name": nav.name, "position": nav.position, "nodes": []} for nav in navs}
        ungrouped = []

        for node in nodes:
            node_data = {
                "id": node.id,
                "name": node.name,
                "type": node.type,
                "status": node.status,
                "nav_id": node.nav_id,
                "parent_id": node.parent_id,
                "meta": node.meta or {},
            }
            if node.nav_id and node.nav_id in nav_map:
                nav_map[node.nav_id]["nodes"].append(node_data)
            else:
                ungrouped.append(node_data)

        result = list(nav_map.values())
        if ungrouped:
            result.append({"id": "", "name": "未分组", "position": 999, "nodes": ungrouped})

        return {"list": result}

    async def get_node_detail(self, kb_id: str, node_id: str, format: str = "markdown") -> Optional[dict]:
        """获取节点详情"""
        return await self.repo.get_detail(kb_id, node_id, format)

    async def update_node(self, req, user_id: str) -> None:
        """更新节点"""
        await self.repo.update(req, user_id)

    async def get_node_stats(self, kb_id: str) -> dict:
        """获取节点统计"""
        return await self.repo.get_stats(kb_id)

    async def node_action(self, req) -> None:
        """节点操作"""
        await self.repo.action(req)

    async def move_node(self, req) -> None:
        """移动节点"""
        await self.repo.move(req)

    async def move_node_nav(self, req) -> None:
        """移动到其他栏目"""
        await self.repo.move_nav(req)

    async def batch_move_node(self, req) -> None:
        """批量移动"""
        await self.repo.batch_move(req)

    async def get_recommend_nodes(self, kb_id: str, nav_ids: list, node_ids: list) -> list:
        """获取推荐节点"""
        return await self.repo.get_recommend_nodes(kb_id, nav_ids, node_ids)

    async def summary_node(self, req) -> None:
        """异步生成摘要 - 通过消息队列触发"""
        node_id = req.node_id if hasattr(req, "node_id") else ""
        kb_id = req.kb_id if hasattr(req, "kb_id") else ""

        # 获取节点内容
        node = await self.repo.get_by_id(node_id)
        if not node:
            return

        try:
            # 获取模型
            from app.models.model import Model
            result = await self.db.execute(
                select(Model).where(Model.type == "analysis", Model.is_active == True)
            )
            model = result.scalar_one_or_none()

            model_name = model.model if model else ""
            summary = await llm_service.summary_node(kb_id, model_name, node.name, node.content)

            # 更新节点摘要
            meta = node.meta or {}
            meta["summary"] = summary
            await self.repo.update_by_id(node_id, {"meta": meta})

            logger.info(f"Node summary generated: {node_id}")
        except Exception as e:
            logger.error(f"Summary node failed: {e}")

    async def stream_summary_node(self, req) -> AsyncGenerator[str, None]:
        """流式生成摘要 - 对应 Go 版 StreamSummaryNode"""
        node_id = req.node_id if hasattr(req, "node_id") else ""
        kb_id = req.kb_id if hasattr(req, "kb_id") else ""

        node = await self.repo.get_by_id(node_id)
        if not node:
            yield f"data: {json.dumps({'event': 'error', 'message': 'Node not found'})}\n\n"
            return

        try:
            from app.models.model import Model
            result = await self.db.execute(
                select(Model).where(Model.type == "analysis", Model.is_active == True)
            )
            model = result.scalar_one_or_none()
            model_name = model.model if model else ""

            full_summary = ""
            async for chunk in llm_service.stream_summary_node(kb_id, model_name, node.name, node.content):
                full_summary += chunk
                event = json.dumps({"event": "message", "data": {"content": chunk}}, ensure_ascii=False)
                yield f"data: {event}\n\n"

            # 保存摘要
            meta = node.meta or {}
            meta["summary"] = full_summary
            await self.repo.update_by_id(node_id, {"meta": meta})

            yield f"data: {json.dumps({'event': 'done'})}\n\n"
        except Exception as e:
            logger.error(f"Stream summary failed: {e}")
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    async def node_restudy(self, node_id: str, kb_id: str) -> None:
        """重新学习 - 触发 RAG 重新索引"""
        node = await self.repo.get_by_id(node_id)
        if not node:
            return

        try:
            # 更新 RAG 状态为 REINDEX
            await self.repo.update_by_id(node_id, {
                "rag_info": {"status": "REINDEX", "message": "重新索引中"},
            })

            # 获取知识库 dataset_id
            from app.models.knowledge_base import KnowledgeBase
            result = await self.db.execute(
                select(KnowledgeBase.dataset_id).where(KnowledgeBase.id == kb_id)
            )
            dataset_id = result.scalar_one_or_none()

            if dataset_id:
                rag_service = get_rag_service()
                # 先删除旧记录
                await rag_service.delete_records(dataset_id, [node_id])

                # 重新上传
                if node.content:
                    await rag_service.upsert_records(
                        UpsertRecordRequest(
                            dataset_id=dataset_id,
                            doc_id=node_id,
                            name=node.name,
                            content=node.content,
                        )
                    )

                # 更新状态为成功
                from datetime import datetime, timezone
                await self.repo.update_by_id(node_id, {
                    "rag_info": {"status": "SUCCEEDED", "message": "索引完成", "synced_at": datetime.now(timezone.utc).isoformat()},
                })

            logger.info(f"Node restudy completed: {node_id}")
        except Exception as e:
            logger.error(f"Node restudy failed: {e}")
            await self.repo.update_by_id(node_id, {
                "rag_info": {"status": "FAILED", "message": str(e)},
            })

    async def get_node_permissions(self, kb_id: str, node_id: str) -> dict:
        """获取节点权限"""
        return await self.repo.get_permissions(kb_id, node_id)

    async def edit_node_permissions(self, req) -> None:
        """编辑节点权限"""
        await self.repo.edit_permissions(req)

    async def get_share_node_list(self, kb_id: str) -> list:
        """获取前台节点列表"""
        return await self.repo.get_share_list(kb_id)

    async def get_share_node_detail(self, kb_id: str, node_id: str) -> Optional[dict]:
        """获取前台节点详情"""
        return await self.repo.get_share_detail(kb_id, node_id)
