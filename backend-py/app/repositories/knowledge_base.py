"""知识库仓储 - 对应 Go 版 repo/pg/knowledge_base.go"""

from datetime import datetime, timezone

from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_base import KnowledgeBase, KBRelease, KBReleaseNodeRelease
from app.models.nav import Nav, NavRelease
from app.models.node import Node, NodeRelease
from app.models.user import KBUser
from app.repositories.base import BaseRepository


class KnowledgeBaseRepository(BaseRepository[KnowledgeBase]):
    """知识库数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(KnowledgeBase, db)

    async def get_list(self) -> list[KnowledgeBase]:
        """获取所有知识库"""
        result = await self.db.execute(select(KnowledgeBase).order_by(KnowledgeBase.created_at))
        return list(result.scalars().all())

    async def get_list_by_user_id(self, user_id: str) -> list[KnowledgeBase]:
        """根据用户ID获取知识库列表"""
        result = await self.db.execute(
            select(KnowledgeBase)
            .join(KBUser, KBUser.kb_id == KnowledgeBase.id)
            .where(KBUser.user_id == user_id)
        )
        return list(result.scalars().all())

    async def create(self, kb: KnowledgeBase, user_id: str = "") -> KnowledgeBase:
        """创建知识库(含默认App和用户映射)"""
        self.db.add(kb)
        # 先 flush 让数据库生成 kb.id（UUID 主键由数据库生成）
        await self.db.flush()
        if user_id:
            kb_user = KBUser(kb_id=kb.id, user_id=user_id, perm="full_control")
            self.db.add(kb_user)
        await self.db.commit()
        await self.db.refresh(kb)
        return kb

    async def delete(self, kb_id: str) -> None:
        """删除知识库(含关联数据)"""
        await self.db.execute(delete(KBUser).where(KBUser.kb_id == kb_id))
        await self.db.execute(delete(KnowledgeBase).where(KnowledgeBase.id == kb_id))
        await self.db.commit()

    async def get_kb_users(self, kb_id: str) -> list[dict]:
        """获取知识库用户列表"""
        from app.models.user import User
        result = await self.db.execute(
            select(User, KBUser.perm)
            .join(KBUser, KBUser.user_id == User.id)
            .where(KBUser.kb_id == kb_id)
        )
        return [{"id": u.id, "account": u.account, "perm": perm} for u, perm in result.all()]

    async def create_kb_user(self, kb_id: str, user_id: str, perm: str) -> None:
        """创建知识库用户映射"""
        kb_user = KBUser(kb_id=kb_id, user_id=user_id, perm=perm)
        self.db.add(kb_user)
        await self.db.commit()

    async def update_kb_user_perm(self, kb_id: str, user_id: str, perm: str) -> None:
        """更新知识库用户权限"""
        await self.db.execute(
            update(KBUser).where(KBUser.kb_id == kb_id, KBUser.user_id == user_id).values(perm=perm)
        )
        await self.db.commit()

    async def delete_kb_user(self, kb_id: str, user_id: str) -> None:
        """删除知识库用户映射"""
        await self.db.execute(
            delete(KBUser).where(KBUser.kb_id == kb_id, KBUser.user_id == user_id)
        )
        await self.db.commit()

    async def create_release(self, req, user_id: str) -> str:
        """创建发布版本 - 对应 Go 版 CreateKBRelease

        完整流程（与 Go 版对齐）：
        1. 将指定节点的 status 更新为 2（Published）
        2. 为每个节点创建 NodeRelease 快照
        3. 创建 KBRelease 记录
        4. 创建 KBReleaseNodeRelease 关联（记录每个节点最新的 NodeRelease）
        5. 快照当前导航信息到 NavRelease
        """
        kb_id = req.kb_id
        node_ids = req.node_ids if hasattr(req, "node_ids") and req.node_ids else []

        # ========== 步骤 1 & 2：发布节点 - 创建 NodeRelease + 更新 status ==========
        node_release_ids = {}  # {node_id: node_release_id}
        if node_ids:
            # 查询要发布的节点
            result = await self.db.execute(
                select(Node).where(Node.kb_id == kb_id, Node.id.in_(node_ids))
            )
            nodes = list(result.scalars().all())

            now = datetime.now(timezone.utc)
            for node in nodes:
                # 更新节点状态为已发布(2)
                node.status = 2

                # 创建 NodeRelease 快照
                node_release = NodeRelease(
                    kb_id=kb_id,
                    publisher_id=user_id,
                    editor_id=node.editor_id,
                    node_id=node.id,
                    doc_id=node.doc_id,
                    type=node.type,
                    name=node.name,
                    meta=node.meta or {},
                    content=node.content,
                    position=node.position,
                    parent_id=node.parent_id,
                )
                self.db.add(node_release)
                await self.db.flush()  # 获取 node_release.id
                node_release_ids[node.id] = node_release.id

        # ========== 步骤 3：创建 KBRelease 记录 ==========
        release = KBRelease(
            kb_id=kb_id,
            tag=req.tag,
            message=req.message,
            publisher_id=user_id,
        )
        self.db.add(release)
        await self.db.flush()  # 获取 release.id

        # ========== 步骤 4：创建 KBReleaseNodeRelease 关联 ==========
        if node_release_ids:
            for node_id, node_release_id in node_release_ids.items():
                # 获取节点的 nav_id
                nav_id = ""
                result = await self.db.execute(
                    select(Node.nav_id).where(Node.id == node_id)
                )
                nav_id = result.scalar_one_or_none() or ""

                rel_node_release = KBReleaseNodeRelease(
                    kb_id=kb_id,
                    release_id=release.id,
                    node_id=node_id,
                    node_release_id=node_release_id,
                    nav_id=nav_id,
                )
                self.db.add(rel_node_release)

        # ========== 步骤 5：快照导航信息到 NavRelease ==========
        nav_result = await self.db.execute(
            select(Nav).where(Nav.kb_id == kb_id).order_by(Nav.position)
        )
        navs = list(nav_result.scalars().all())
        for nav in navs:
            nav_release = NavRelease(
                nav_id=nav.id,
                release_id=release.id,
                kb_id=kb_id,
                name=nav.name,
                position=nav.position,
            )
            self.db.add(nav_release)

        await self.db.commit()
        await self.db.refresh(release)
        return release.id

    async def get_release_list(self, kb_id: str, offset: int, limit: int) -> list[KBRelease]:
        """获取发布版本列表"""
        result = await self.db.execute(
            select(KBRelease)
            .where(KBRelease.kb_id == kb_id)
            .order_by(KBRelease.created_at.desc())
            .offset(offset).limit(limit)
        )
        return list(result.scalars().all())
