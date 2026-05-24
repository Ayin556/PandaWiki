"""数据库基础设施 - SQLAlchemy 2.0 async"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# 异步引擎
engine = create_async_engine(
    settings.pg_dsn_resolved,
    echo=settings.is_development,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

# 异步会话工厂
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """SQLAlchemy 声明式基类"""
    pass


async def init_db():
    """初始化数据库连接"""
    # 注意: 表创建由 Alembic 管理，这里仅验证连接
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))


async def get_db() -> AsyncSession:
    """获取数据库会话 (用于 FastAPI Depends)"""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


# 需要在 init_db 之前导入所有模型以注册表结构
from sqlalchemy import text  # noqa: E402
