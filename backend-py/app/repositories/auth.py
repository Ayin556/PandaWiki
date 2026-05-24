"""认证仓储 - 对应 Go 版 repo/pg/auth.go"""

from typing import Optional

from loguru import logger
from sqlalchemy import select, delete, update, any_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import Auth, AuthGroup, AuthConfig
from app.repositories.base import BaseRepository


class AuthRepository(BaseRepository[Auth]):
    """认证数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(Auth, db)

    async def get_by_source_type(self, kb_id: str, source_type: str) -> list[Auth]:
        """按来源类型获取认证用户列表"""
        result = await self.db.execute(
            select(Auth).where(Auth.kb_id == kb_id, Auth.source_type == source_type)
        )
        return list(result.scalars().all())

    async def get_by_union_id(self, kb_id: str, union_id: str, source_type: str) -> Optional[Auth]:
        """按 UnionID 获取认证用户"""
        result = await self.db.execute(
            select(Auth).where(
                Auth.kb_id == kb_id,
                Auth.union_id == union_id,
                Auth.source_type == source_type,
            )
        )
        return result.scalar_one_or_none()

    async def create_auth(self, auth: Auth) -> Auth:
        """创建认证用户"""
        self.db.add(auth)
        await self.db.commit()
        await self.db.refresh(auth)
        return auth

    async def delete_by_kb_and_id(self, kb_id: str, auth_id: int) -> None:
        """删除认证用户"""
        await self.db.execute(
            delete(Auth).where(Auth.kb_id == kb_id, Auth.id == auth_id)
        )
        await self.db.commit()

    async def get_auth_by_source_type(self, source_type: str) -> Optional[Auth]:
        """按来源类型获取首个认证用户 - 对应 Go 版 GetAuthBySourceType
        
        Go 版: r.db.Where("source_type = ?", sourceType).First(&auth)
        用于匿名用户回退获取默认 auth 记录
        """
        result = await self.db.execute(
            select(Auth).where(Auth.source_type == source_type).limit(1)
        )
        return result.scalar_one_or_none()

    async def get_auth_group_ids_with_parents(self, auth_id: int) -> list[int]:
        """获取认证用户的组ID列表（含父组） - 对应 Go 版 GetAuthGroupIdsWithParentsByAuthId

        Go 版逻辑：
        1. 查找 auth_id 在 auth_ids 数组中的直接组（PostgreSQL: WHERE ? = ANY(auth_ids)）
        2. 向上递归查找所有父组
        3. 返回所有组ID列表（用于 RAG 权限过滤）
        """
        if auth_id == 0:
            return []

        # 1. 获取直接所属的组（Go 版: WHERE ? = ANY(auth_ids)）
        result = await self.db.execute(
            select(AuthGroup).where(auth_id == any_(AuthGroup.auth_ids))
        )
        direct_groups = list(result.scalars().all())

        if not direct_groups:
            return []

        # 2. 获取所有组构建映射
        all_result = await self.db.execute(select(AuthGroup))
        all_groups = list(all_result.scalars().all())
        group_map = {g.id: g for g in all_groups}

        # 3. 递归查找所有父组
        result_groups: dict[int, AuthGroup] = {}
        visited: set[int] = set()

        def find_parents(group_id: int):
            if group_id in visited:
                return
            visited.add(group_id)
            group = group_map.get(group_id)
            if not group:
                return
            result_groups[group.id] = group
            if group.parent_id is not None:
                find_parents(group.parent_id)

        for group in direct_groups:
            result_groups[group.id] = group
            if group.parent_id is not None:
                find_parents(group.parent_id)

        return list(result_groups.keys())


class AuthConfigRepository(BaseRepository[AuthConfig]):
    """认证配置数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(AuthConfig, db)

    async def get_by_kb_and_source_type(self, kb_id: str, source_type: str) -> Optional[AuthConfig]:
        """按知识库和来源类型获取认证配置"""
        result = await self.db.execute(
            select(AuthConfig).where(
                AuthConfig.kb_id == kb_id,
                AuthConfig.source_type == source_type,
            )
        )
        return result.scalar_one_or_none()

    async def upsert(self, kb_id: str, source_type: str, auth_setting: dict) -> AuthConfig:
        """创建或更新认证配置"""
        existing = await self.get_by_kb_and_source_type(kb_id, source_type)
        if existing:
            await self.db.execute(
                update(AuthConfig)
                .where(AuthConfig.id == existing.id)
                .values(auth_setting=auth_setting)
            )
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        config = AuthConfig(kb_id=kb_id, source_type=source_type, auth_setting=auth_setting)
        self.db.add(config)
        await self.db.commit()
        await self.db.refresh(config)
        return config


class AuthGroupRepository(BaseRepository[AuthGroup]):
    """认证用户组数据访问"""

    def __init__(self, db: AsyncSession):
        super().__init__(AuthGroup, db)

    async def get_by_kb_id(self, kb_id: str) -> list[AuthGroup]:
        """按知识库获取用户组列表"""
        result = await self.db.execute(
            select(AuthGroup).where(AuthGroup.kb_id == kb_id).order_by(AuthGroup.position)
        )
        return list(result.scalars().all())
