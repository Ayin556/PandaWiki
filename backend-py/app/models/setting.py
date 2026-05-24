"""设置模型 - 对应 Go 版 domain/setting.go"""

from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, JSONType


class Setting(Base, TimestampMixin):
    """知识库设置表"""
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kb_id: Mapped[str] = mapped_column(String(36), nullable=False)
    key: Mapped[str] = mapped_column(String(255), nullable=False, comment="设置键 (system_prompt, block_words 等)")
    value: Mapped[dict] = mapped_column(JSONType, default=dict, comment="设置值 JSON")
    description: Mapped[str] = mapped_column(String(500), default="")

    def __repr__(self) -> str:
        return f"<Setting(id={self.id}, kb_id={self.kb_id}, key={self.key})>"


class SystemSetting(Base, TimestampMixin):
    """系统设置表"""
    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(255), nullable=False, comment="设置键 (model_setting_mode, upload 等)")
    value: Mapped[dict] = mapped_column(JSONType, default=dict, comment="设置值 JSON")
    description: Mapped[str] = mapped_column(String(500), default="")

    def __repr__(self) -> str:
        return f"<SystemSetting(id={self.id}, key={self.key})>"
