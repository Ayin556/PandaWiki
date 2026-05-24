"""知识库仓储 - 对应 Go 版 repo/pg/knowledge_base.go"""

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_base import KnowledgeBase, KBRelease, KBReleaseNodeRelease
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
        from sqlalchemy import update
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
        """创建发布版本"""
        release = KBRelease(kb_id=req.kb_id, tag=req.tag, message=req.message, publisher_id=user_id)
        self.db.add(release)
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
