"""认证模型 - 对应 Go 版 domain/auth.go"""

from datetime import datetime

from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, JSONType


class Auth(Base, TimestampMixin):
    """认证用户表"""
    __tablename__ = "auths"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ip: Mapped[str] = mapped_column(String(50), default="")
    kb_id: Mapped[str] = mapped_column(String(36), nullable=False)
    union_id: Mapped[str] = mapped_column(String(255), default="")
    source_type: Mapped[str] = mapped_column(String(50), default="")
    last_login_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    user_info: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        comment="用户信息 JSON (username, avatar_url, email)",
    )

    def __repr__(self) -> str:
        return f"<Auth(id={self.id}, source_type={self.source_type})>"


class AuthGroup(Base, TimestampMixin):
    """认证用户组表 - 支持层级结构"""
    __tablename__ = "auth_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    kb_id: Mapped[str] = mapped_column(String(36), nullable=False)
    parent_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    position: Mapped[float] = mapped_column(Float, default=0.0)
    # auth_ids 在数据库中是 integer[] 类型（对应 Go 版 pq.Int64Array）
    auth_ids: Mapped[list[int]] = mapped_column(
        ARRAY(Integer),
        default=list,
        comment="包含的认证用户ID列表",
    )
    sync_id: Mapped[str] = mapped_column(String(255), default="")
    sync_parent_id: Mapped[str] = mapped_column(String(255), default="")
    source_type: Mapped[str] = mapped_column(String(50), default="")

    def __repr__(self) -> str:
        return f"<AuthGroup(id={self.id}, name={self.name})>"


class AuthConfig(Base, TimestampMixin):
    """认证配置表"""
    __tablename__ = "auth_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kb_id: Mapped[str] = mapped_column(String(36), nullable=False)
    auth_setting: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        comment="认证配置 JSON (client_id, client_secret, proxy)",
    )
    source_type: Mapped[str] = mapped_column(String(50), unique=True, default="")

    def __repr__(self) -> str:
        return f"<AuthConfig(id={self.id}, source_type={self.source_type})>"
