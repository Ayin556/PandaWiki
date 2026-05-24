"""数据库基础设施 - SQLAlchemy 2.0 async"""

from loguru import logger
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

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


async def init_db():
    """初始化数据库连接，验证数据库可达性（启动时容错）"""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection established")
    except Exception as e:
        logger.warning(f"Database not available at startup, will retry on request: {e}")


async def get_db() -> AsyncSession:
    """获取数据库会话 (用于 FastAPI Depends)"""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
