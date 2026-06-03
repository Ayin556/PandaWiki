"""知识库服务 - 对应 Go 版 usecase/knowledge_base.go"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_base import KnowledgeBase
from app.repositories.knowledge_base import KnowledgeBaseRepository
from app.infrastructure.rag import get_rag_service


class KnowledgeBaseService:
    """知识库业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = KnowledgeBaseRepository(db)

    async def create_knowledge_base(self, req, user_id: str) -> KnowledgeBase:
        """创建知识库"""
        # 1. 在 RAG 中创建数据集
        rag_service = get_rag_service()
        dataset_id = await rag_service.create_knowledge_base(req.name)

        # 2. 创建数据库记录
        kb = KnowledgeBase(
            name=req.name,
            dataset_id=dataset_id,
            access_settings=req.access_settings or {},
        )
        kb = await self.repo.create(kb, user_id)
        return kb

    async def get_knowledge_base_list(self, user_id: str = "") -> list:
        """获取知识库列表"""
        if user_id:
            return await self.repo.get_list_by_user_id(user_id)
        return await self.repo.get_list()

    async def get_knowledge_base(self, kb_id: str) -> KnowledgeBase | None:
        """获取知识库详情"""
        return await self.repo.get_by_id(kb_id)

    async def update_knowledge_base(self, req) -> None:
        """更新知识库"""
        await self.repo.update(req)

    async def delete_knowledge_base(self, kb_id: str) -> None:
        """删除知识库"""
        kb = await self.repo.get_by_id(kb_id)
        if kb:
            # 删除 RAG 数据集
            rag_service = get_rag_service()
            await rag_service.delete_knowledge_base(kb.dataset_id)
            # 删除数据库记录
            await self.repo.delete(kb_id)

    async def get_kb_users(self, kb_id: str) -> list:
        """获取知识库用户列表"""
        return await self.repo.get_kb_users(kb_id)

    async def invite_kb_user(self, req) -> None:
        """邀请用户加入知识库"""
        await self.repo.create_kb_user(req.kb_id, req.user_id, req.perm)

    async def update_kb_user(self, req) -> None:
        """更新知识库用户权限"""
        await self.repo.update_kb_user_perm(req.kb_id, req.user_id, req.perm)

    async def delete_kb_user(self, kb_id: str, user_id: str) -> None:
        """移除知识库用户"""
        await self.repo.delete_kb_user(kb_id, user_id)

    async def create_kb_release(self, req, user_id: str) -> str:
        """创建知识库发布版本"""
        return await self.repo.create_release(req, user_id)

    async def get_kb_release_list(self, kb_id: str, offset: int, limit: int) -> tuple[list, int]:
        """获取发布版本列表，返回 (list, total)"""
        return await self.repo.get_release_list(kb_id, offset, limit)
