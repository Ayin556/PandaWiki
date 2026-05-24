"""节点仓储 - 对应 Go 版 repo/pg/node.go"""

from typing import Optional
from sqlalchemy import select, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node import Node, NodeRelease, NodeAuthGroup
from app.models.nav import Nav
from app.repositories.base import BaseRepository


class NodeRepository(BaseRepository[Node]):
    """节点数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(Node, db)

    async def create(self, req, user_id: str) -> str:
        """创建节点"""
        node = Node(
            kb_id=req.kb_id,
            nav_id=req.nav_id,
            name=req.name,
            content=req.content,
            type=req.type,
            parent_id=req.parent_id,
            creator_id=user_id,
            editor_id=user_id,
            meta={},
            permissions={},
            rag_info={},
        )
        self.db.add(node)
        await self.db.commit()
        await self.db.refresh(node)
        return node.id

    async def get_list(self, kb_id: str, nav_id: str = "", search: str = "", status: str = "") -> list:
        """获取节点列表
        
        Args:
            kb_id: 知识库 ID
            nav_id: 可选，栏目 ID 过滤
            search: 可选，搜索关键词
            status: 可选，节点状态过滤 (released/unpublished/unstudied)
        """
        query = select(Node).where(Node.kb_id == kb_id)
        if nav_id:
            query = query.where(Node.nav_id == nav_id)
        if search:
            query = query.where(Node.name.ilike(f"%{search}%"))
        # status 过滤 - 与 Go 版对齐
        if status == "released":
            query = query.where(Node.status == 2)
        elif status == "unpublished":
            query = query.where(Node.status.in_([0, 1]))
        elif status == "unstudied":
            # 已发布但 RAG 状态异常的文档
            query = query.where(Node.status == 2)
        query = query.order_by(Node.position, Node.created_at)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_list_group_by_nav(self, kb_id: str, search: str = "") -> dict:
        """按栏目分组获取节点"""
        nodes = await self.get_list(kb_id, search=search)
        # 获取所有栏目
        nav_result = await self.db.execute(
            select(Nav).where(Nav.kb_id == kb_id).order_by(Nav.position)
        )
        navs = list(nav_result.scalars().all())

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

    async def get_detail(self, kb_id: str, node_id: str, format: str = "markdown") -> Optional[dict]:
        """获取节点详情"""
        result = await self.db.execute(
            select(Node).where(Node.id == node_id, Node.kb_id == kb_id)
        )
        node = result.scalar_one_or_none()
        if not node:
            return None

        # 获取发布者/编辑者名称
        from app.models.user import User
        creator_name = ""
        if node.creator_id:
            c_result = await self.db.execute(select(User.account).where(User.id == node.creator_id))
            creator_name = c_result.scalar_one_or_none() or ""

        editor_name = ""
        if node.editor_id:
            e_result = await self.db.execute(select(User.account).where(User.id == node.editor_id))
            editor_name = e_result.scalar_one_or_none() or ""

        return {
            "id": node.id,
            "kb_id": node.kb_id,
            "name": node.name,
            "content": node.content,
            "type": node.type,
            "status": node.status,
            "nav_id": node.nav_id,
            "parent_id": node.parent_id,
            "meta": node.meta or {},
            "permissions": node.permissions or {},
            "rag_info": node.rag_info or {},
            "creator_id": node.creator_id,
            "editor_id": node.editor_id,
            "creator_name": creator_name,
            "editor_name": editor_name,
            "edit_time": node.edit_time.isoformat() if node.edit_time else "",
            "created_at": node.created_at.isoformat() if node.created_at else "",
        }

    async def update(self, req, user_id: str) -> None:
        """更新节点"""
        data = {"editor_id": user_id}
        if hasattr(req, "name") and req.name is not None:
            data["name"] = req.name
        if hasattr(req, "content") and req.content is not None:
            data["content"] = req.content
        if hasattr(req, "nav_id") and req.nav_id is not None:
            data["nav_id"] = req.nav_id
        if hasattr(req, "meta") and req.meta is not None:
            data["meta"] = req.meta
        if hasattr(req, "permissions") and req.permissions is not None:
            data["permissions"] = req.permissions

        await self.update_by_id(req.id, data)

    async def get_stats(self, kb_id: str) -> dict:
        """获取节点统计"""
        # 未发布文档数
        unpublished = await self.db.execute(
            select(func.count()).select_from(Node)
            .where(Node.kb_id == kb_id, Node.status != 2)
        )
        # 未学习文档数 (已发布但 RAG 未同步)
        unstudied = await self.db.execute(
            select(func.count()).select_from(Node)
            .where(Node.kb_id == kb_id, Node.status == 2)
        )
        # 未发布栏目数
        from app.models.nav import Nav
        unpublished_nav = await self.db.execute(
            select(func.count()).select_from(Nav)
            .where(Nav.kb_id == kb_id)
        )
        return {
            "unpublished_count": unpublished.scalar_one(),
            "unstudied_count": unstudied.scalar_one(),
            "unpublished_nav_count": unpublished_nav.scalar_one(),
        }

    async def action(self, req) -> None:
        """节点操作"""
        if hasattr(req, "action") and req.action == "delete":
            await self.delete_by_id(req.id)

    async def move(self, req) -> None:
        """移动节点"""
        await self.update_by_id(req.id, {"parent_id": req.parent_id})

    async def move_nav(self, req) -> None:
        """移动到其他栏目"""
        # 兼容 ids 和 node_ids 两种字段名
        node_ids = getattr(req, "ids", None) or getattr(req, "node_ids", [])
        for node_id in node_ids:
            await self.db.execute(
                update(Node).where(Node.id == node_id).values(nav_id=req.nav_id)
            )
        await self.db.commit()

    async def batch_move(self, req) -> None:
        """批量移动"""
        # 兼容 ids 和 node_ids 两种字段名
        node_ids = getattr(req, "ids", None) or getattr(req, "node_ids", [])
        for node_id in node_ids:
            await self.db.execute(
                update(Node).where(Node.id == node_id).values(parent_id=req.parent_id)
            )
        await self.db.commit()

    async def get_recommend_nodes(self, kb_id: str, nav_ids: list, node_ids: list) -> list:
        """获取推荐节点 - 对应 Go 版 RecommendNodes，返回递归树结构

        Go 版 RecommendNodeListResp 字段：id, nav_id, nav_name, name, type, summary,
        parent_id, position, emoji, recommend_nodes(递归), permissions
        """
        result_list = []
        seen_ids = set()

        # 按节点 ID 获取
        if node_ids:
            result = await self.db.execute(
                select(Node).where(Node.kb_id == kb_id, Node.id.in_(node_ids), Node.status == 2)
            )
            for n in result.scalars().all():
                if n.id not in seen_ids:
                    result_list.append(n)
                    seen_ids.add(n.id)

        # 按栏目 ID 获取
        if nav_ids:
            result = await self.db.execute(
                select(Node).where(Node.kb_id == kb_id, Node.nav_id.in_(nav_ids), Node.status == 2)
                .order_by(Node.position).limit(20)
            )
            for n in result.scalars().all():
                if n.id not in seen_ids:
                    result_list.append(n)
                    seen_ids.add(n.id)

        # 批量获取栏目名称
        nav_name_map = {}
        nav_id_set = {n.nav_id for n in result_list if n.nav_id}
        if nav_id_set:
            nav_result = await self.db.execute(select(Nav.id, Nav.name).where(Nav.id.in_(nav_id_set)))
            nav_name_map = dict(nav_result.all())

        # 构建递归树结构
        def build_node_data(n: Node) -> dict:
            meta = n.meta or {}
            permissions = n.permissions or {}
            return {
                "id": n.id,
                "nav_id": n.nav_id,
                "nav_name": nav_name_map.get(n.nav_id, ""),
                "name": n.name,
                "type": n.type,
                "summary": meta.get("summary", ""),
                "parent_id": n.parent_id,
                "position": n.position,
                "emoji": meta.get("emoji", ""),
                "recommend_nodes": [],
                "permissions": {
                    "answerable": permissions.get("answerable", "open"),
                    "visitable": permissions.get("visitable", "open"),
                    "visible": permissions.get("visible", "open"),
                },
            }

        node_map = {}
        for n in result_list:
            node_map[n.id] = build_node_data(n)

        # 构建父子关系树（文件夹包含子文档）
        root_nodes = []
        for n in result_list:
            node_data = node_map[n.id]
            if n.parent_id and n.parent_id in node_map:
                node_map[n.parent_id]["recommend_nodes"].append(node_data)
            else:
                root_nodes.append(node_data)

        return root_nodes

    async def get_permissions(self, kb_id: str, node_id: str) -> dict:
        """获取节点权限"""
        result = await self.db.execute(
            select(Node).where(Node.id == node_id, Node.kb_id == kb_id)
        )
        node = result.scalar_one_or_none()
        if not node:
            return {}
        permissions = node.permissions or {}
        # 补充权限组关联
        ag_result = await self.db.execute(
            select(NodeAuthGroup).where(NodeAuthGroup.node_id == node_id)
        )
        auth_groups = list(ag_result.scalars().all())

        return {
            "answerable": permissions.get("answerable", "open"),
            "visitable": permissions.get("visitable", "open"),
            "visible": permissions.get("visible", "open"),
            "auth_groups": [
                {"auth_group_id": ag.auth_group_id, "perm": ag.perm}
                for ag in auth_groups
            ],
        }

    async def edit_permissions(self, req) -> None:
        """编辑节点权限"""
        permissions = {}
        if hasattr(req, "answerable") and req.answerable is not None:
            permissions["answerable"] = req.answerable
        if hasattr(req, "visitable") and req.visitable is not None:
            permissions["visitable"] = req.visitable
        if hasattr(req, "visible") and req.visible is not None:
            permissions["visible"] = req.visible

        # 合并现有权限
        node = await self.get_by_id(req.node_id)
        if node:
            current = node.permissions or {}
            merged = {**current, **permissions}
            await self.update_by_id(req.node_id, {"permissions": merged})

            # 更新权限组关联
            if hasattr(req, "auth_groups"):
                await self.db.execute(
                    delete(NodeAuthGroup).where(NodeAuthGroup.node_id == req.node_id)
                )
                for ag in (req.auth_groups or []):
                    nag = NodeAuthGroup(
                        node_id=req.node_id,
                        auth_group_id=ag.get("auth_group_id", 0),
                        perm=ag.get("perm", ""),
                    )
                    self.db.add(nag)
                await self.db.commit()

    async def get_share_list(self, kb_id: str) -> list:
        """获取前台节点列表 - 只返回已发布节点"""
        result = await self.db.execute(
            select(Node).where(Node.kb_id == kb_id, Node.status == 2)
            .order_by(Node.position, Node.created_at)
        )
        return list(result.scalars().all())

    async def get_share_detail(self, kb_id: str, node_id: str) -> Optional[dict]:
        """获取前台节点详情 - 只返回已发布节点"""
        result = await self.db.execute(
            select(Node).where(Node.id == node_id, Node.kb_id == kb_id, Node.status == 2)
        )
        node = result.scalar_one_or_none()
        if not node:
            return None

        # 尝试获取已发布版本
        release_result = await self.db.execute(
            select(NodeRelease).where(NodeRelease.node_id == node_id)
            .order_by(NodeRelease.created_at.desc()).limit(1)
        )
        release = release_result.scalar_one_or_none()

        return {
            "id": node.id,
            "kb_id": node.kb_id,
            "name": release.name if release else node.name,
            "content": release.content if release else node.content,
            "type": node.type,
            "nav_id": node.nav_id,
            "parent_id": node.parent_id,
            "meta": (release.meta if release else node.meta) or {},
            "created_at": node.created_at.isoformat() if node.created_at else "",
        }
