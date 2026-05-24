"""SQLAlchemy 模型基类"""

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, func, types
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """声明式基类 - 全局唯一，供所有 ORM 模型和 Alembic 共享"""
    pass


class JSONType(types.TypeDecorator):
    """PostgreSQL JSONB 类型，Python 侧自动序列化/反序列化"""
    impl = JSONB
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            if isinstance(value, str):
                return value
            return json.dumps(value, ensure_ascii=False)
        return None

    def process_result_value(self, value, dialect):
        if value is not None:
            if isinstance(value, dict | list):
                return value
            return json.loads(value)
        return None


class TimestampMixin:
    """时间戳混入类（created_at + updated_at）"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class CreatedAtMixin:
    """仅 created_at 的混入类（数据库无 updated_at 的表使用）"""
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class UUIDPrimaryKey:
    """UUID 主键混入类"""
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )


class IntPrimaryKey:
    """自增整数主键混入类"""
    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
