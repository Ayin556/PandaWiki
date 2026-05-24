"""AI模型配置 - 对应 Go 版 domain/model.go"""

from sqlalchemy import String, BigInteger
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey, JSONType


class Model(Base, UUIDPrimaryKey, TimestampMixin):
    """AI模型配置表"""
    __tablename__ = "models"

    provider: Mapped[str] = mapped_column(String(100), default="")
    model: Mapped[str] = mapped_column(String(255), default="")
    api_key: Mapped[str] = mapped_column(String(500), default="")
    api_header: Mapped[str] = mapped_column(String(255), default="")
    base_url: Mapped[str] = mapped_column(String(500), default="")
    api_version: Mapped[str] = mapped_column(String(100), default="")
    type: Mapped[str] = mapped_column(String(50), unique=True, default="chat", comment="chat/embedding/rerank/analysis/analysis-vl")
    is_active: Mapped[bool] = mapped_column(default=True)
    prompt_tokens: Mapped[int] = mapped_column(BigInteger, default=0)
    completion_tokens: Mapped[int] = mapped_column(BigInteger, default=0)
    total_tokens: Mapped[int] = mapped_column(BigInteger, default=0)
    parameters: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        comment="模型参数 JSON (context_window, max_tokens, r1_enabled, temperature等)",
    )

    def __repr__(self) -> str:
        return f"<Model(id={self.id}, type={self.type}, provider={self.provider})>"
