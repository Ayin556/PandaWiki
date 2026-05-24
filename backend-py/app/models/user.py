"""用户模型 - 对应 Go 版 domain/user.go"""

from datetime import datetime

from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKey
from app.core.constants import UserRole


class User(Base, UUIDPrimaryKey, CreatedAtMixin):
    """用户表（无 updated_at，与数据库一致）"""
    __tablename__ = "users"

    account: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default=UserRole.USER)
    last_access: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # 关系
    kb_users: Mapped[list["KBUser"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, account={self.account}, role={self.role})>"


class KBUser(Base, CreatedAtMixin):
    """知识库-用户关联表"""
    __tablename__ = "kb_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kb_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_bases.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    perm: Mapped[str] = mapped_column(String(50), default="doc_manage")

    # 联合唯一约束
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )

    # 关系
    user: Mapped["User"] = relationship(back_populates="kb_users")

    def __repr__(self) -> str:
        return f"<KBUser(kb_id={self.kb_id}, user_id={self.user_id}, perm={self.perm})>"
