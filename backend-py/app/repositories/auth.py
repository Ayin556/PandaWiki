"""认证仓储 - 对应 Go 版 repo/pg/auth.go"""

from typing import Optional

from sqlalchemy import select, delete, update
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
