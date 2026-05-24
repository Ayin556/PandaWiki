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

    async def get_node_list_group_nav(self, **kwargs) -> list:
        """按栏目分组获取节点列表 - 对应 Go 版 GetNodeListGroupByNav，直接返回数组
        
        参数:
        - kb_id: 必填，知识库 ID
        - search: 可选，搜索关键词
        - status: 可选，节点状态过滤 (released=2/unpublished=0,1/unstudied=已发布但RAG未同步)
        - nav_ids: 可选，栏目 ID 数组，筛选指定栏目
        """
        kb_id = kwargs.get("kb_id", "")
        search = kwargs.get("search", "")
        status = kwargs.get("status", "")
        nav_ids = kwargs.get("nav_ids", [])

        # 获取栏目列表
        navs = await self.nav_repo.get_list(kb_id)
        # 如果指定了 nav_ids，只保留指定的栏目
        if nav_ids:
            navs = [nav for nav in navs if nav.id in nav_ids]

        # 获取所有节点（支持 status 过滤）
        nodes = await self.repo.get_list(kb_id=kb_id, search=search, status=status)

        # 批量查询用户名称（creator/editor），避免 N+1 查询
        user_ids = set()
        for node in nodes:
            if node.creator_id:
                user_ids.add(node.creator_id)
            if node.editor_id:
                user_ids.add(node.editor_id)
        user_name_map = {}
        if user_ids:
            from app.models.user import User
            u_result = await self.db.execute(
                select(User.id, User.account).where(User.id.in_(user_ids))
            )
            user_name_map = dict(u_result.all())

        # 按栏目分组 - 字段名与 Go 版 NodeListGroupNavResp 对齐
        nav_map = {}
        for nav in navs:
            nav_map[nav.id] = {
                "nav_id": nav.id,
                "nav_name": nav.name,
                "position": nav.position,
                "count": 0,
                "is_released": False,
                "list": [],
            }

        ungrouped = []
        for node in nodes:
            # 构建节点数据 - 字段名与 Go 版 NodeListItemResp 对齐
            meta = node.meta or {}
            permissions = node.permissions or {}
            node_data = {
                "id": node.id,
                "name": node.name,
                "type": node.type,
                "status": node.status,
                "nav_id": node.nav_id,
                "parent_id": node.parent_id,
                "position": node.position,
                "rag_info": node.rag_info or {},
                "summary": meta.get("summary", ""),
                "emoji": meta.get("emoji", ""),
                "content_type": meta.get("content_type", "md"),
                "created_at": node.created_at.isoformat() if node.created_at else "",
                "updated_at": node.updated_at.isoformat() if node.updated_at else "",
                "creator_id": node.creator_id,
                "editor_id": node.editor_id,
                "creator": user_name_map.get(node.creator_id, ""),
                "editor": user_name_map.get(node.editor_id, ""),
                "publisher_id": node.editor_id,  # Go 版取 editor_id 作为 publisher_id
                "permissions": {
                    "answerable": permissions.get("answerable", "open"),
                    "visitable": permissions.get("visitable", "open"),
                    "visible": permissions.get("visible", "open"),
                },
                "meta": meta,
            }
            if node.nav_id and node.nav_id in nav_map:
                nav_map[node.nav_id]["list"].append(node_data)
                nav_map[node.nav_id]["count"] += 1
            else:
                ungrouped.append(node_data)

        # 计算每个栏目的 is_released 状态
        for nav_id, group in nav_map.items():
            if group["count"] > 0:
                # 栏目下所有节点都已发布则 is_released=True
                group["is_released"] = all(n["status"] == 2 for n in group["list"])

        result = list(nav_map.values())
        if ungrouped:
            result.append({
                "nav_id": "",
                "nav_name": "未分组",
                "position": 999,
                "count": len(ungrouped),
                "is_released": False,
                "list": ungrouped,
            })

        # 搜索时过滤掉空分组 - 与 Go 版逻辑一致
        if search:
            result = [g for g in result if g["count"] > 0]

        return result

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

    async def node_restudy(self, node_ids: list[str], kb_id: str) -> None:
        """重新学习 - 对应 Go 版 NodeUsecase.NodeRestudy + MQ Handler HandleNodeContentVectorRequest

        Go 版流程：获取 node_releases → 发送 MQ 异步任务 → MQ 消费者：
        1. 获取 node_release（含目录路径）
        2. 文件夹类型跳过
        3. 获取 kb.dataset_id
        4. 获取 answerable group_ids → 传给 RAG upsert
        5. RAG upsert（含 group_ids）
        6. 更新 node_release.doc_id
        7. 删除旧 doc_ids 的 RAG 记录
        """
        from app.models.knowledge_base import KnowledgeBase
        from datetime import datetime, timezone

        # 获取知识库 dataset_id
        result = await self.db.execute(
            select(KnowledgeBase).where(KnowledgeBase.id == kb_id)
        )
        kb = result.scalar_one_or_none()
        if not kb or not kb.dataset_id:
            logger.error(f"Knowledge base not found or no dataset_id: {kb_id}")
            return

        dataset_id = kb.dataset_id

        # 获取每个节点的最新 node_release
        for node_id in node_ids:
            try:
                # 更新 RAG 状态为 REINDEX
                await self.repo.update_by_id(node_id, {
                    "rag_info": {"status": "REINDEX", "message": "重新索引中"},
                })

                # 获取最新 node_release（Go 版：GetLatestNodeReleaseByNodeIDs）
                release_result = await self.db.execute(
                    select(NodeRelease)
                    .where(NodeRelease.node_id == node_id, NodeRelease.kb_id == kb_id)
                    .order_by(NodeRelease.created_at.desc())
                    .limit(1)
                )
                release = release_result.scalar_one_or_none()

                if not release:
                    logger.warning(f"No node_release found for node {node_id}, skipping")
                    await self.repo.update_by_id(node_id, {
                        "rag_info": {"status": "FAILED", "message": "文档未首次发布，无法重新学习"},
                    })
                    continue

                # Go 版：文件夹类型跳过
                if release.type == 1:  # type=1 为文件夹
                    logger.info(f"Node {node_id} is folder, skip upsert")
                    await self.repo.update_by_id(node_id, {
                        "rag_info": {"status": "SUCCEEDED", "message": "文件夹类型无需索引"},
                    })
                    continue

                # Go 版 MQ Consumer：获取 answerable group_ids
                group_ids = await self._get_node_answerable_group_ids(node_id)

                rag_service = get_rag_service()

                # 上传到 RAG（对齐 Go 版 MQ Handler upsert 逻辑）
                if release.content:
                    # Go 版: UpsertRecordsRequest{ID: nodeRelease.ID, Title, DatasetID, DocID, Content, GroupIDs}
                    doc_id = await rag_service.upsert_records(
                        UpsertRecordRequest(
                            id=release.id,  # Go 版用 nodeRelease.ID 作为文件名
                            dataset_id=dataset_id,
                            doc_id=release.doc_id or release.id,
                            name=release.name,
                            content=release.content,
                            group_ids=group_ids,  # Go 版: answerable 权限的 group_ids
                        )
                    )

                    # 更新 node_release 的 doc_id（Go 版: UpdateNodeReleaseDocID）
                    if doc_id and doc_id != release.doc_id:
                        await self.db.execute(
                            update(NodeRelease)
                            .where(NodeRelease.id == release.id)
                            .values(doc_id=doc_id)
                        )
                        await self.db.commit()

                    # Go 版: 删除旧 doc_ids（GetOldNodeDocIDsByNodeID）
                    if release.doc_id and doc_id != release.doc_id:
                        try:
                            await rag_service.delete_records(dataset_id, [release.doc_id])
                        except Exception as e:
                            logger.warning(f"Delete old doc_id {release.doc_id} failed: {e}")

                # 更新状态为成功
                await self.repo.update_by_id(node_id, {
                    "rag_info": {
                        "status": "SUCCEEDED",
                        "message": "索引完成",
                        "synced_at": datetime.now(timezone.utc).isoformat(),
                    },
                })

                logger.info(f"Node restudy completed: {node_id}")

            except Exception as e:
                logger.error(f"Node restudy failed for {node_id}: {e}")
                await self.repo.update_by_id(node_id, {
                    "rag_info": {"status": "FAILED", "message": str(e)},
                })

    async def _get_node_answerable_group_ids(self, node_id: str) -> list[int]:
        """获取节点 answerable 权限的 group_ids - 对应 Go 版 GetNodeAuthGroupIdsByNodeId

        Go 版: nodeRepo.GetNodeAuthGroupIdsByNodeId(nodeID, "answerable")
        """
        try:
            result = await self.db.execute(
                select(NodeAuthGroup.group_id).where(
                    NodeAuthGroup.node_id == node_id,
                    NodeAuthGroup.perm == "answerable",
                )
            )
            return [row[0] for row in result.all()]
        except Exception as e:
            logger.warning(f"Failed to get answerable group_ids for {node_id}: {e}")
            return []

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
