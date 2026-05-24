"""API令牌模型 - 对应 Go 版 domain/api_token.go"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey


class APIToken(Base, UUIDPrimaryKey, TimestampMixin):
    """API 令牌表"""
    __tablename__ = "api_tokens"

    name: Mapped[str] = mapped_column(String(255), default="")
    user_id: Mapped[str] = mapped_column(String(36), default="")
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    kb_id: Mapped[str] = mapped_column(String(36), default="")
    permission: Mapped[str] = mapped_column(String(50), default="")

    def __repr__(self) -> str:
        return f"<APIToken(id={self.id}, name={self.name})>"
