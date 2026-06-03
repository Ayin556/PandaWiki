"""文档反馈模型 - 对应 Go 版 Pro 功能"""

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKey, JSONType


class DocumentFeedback(Base, UUIDPrimaryKey, CreatedAtMixin):
    """文档评价反馈表"""
    __tablename__ = "document_feedbacks"

    kb_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    node_id: Mapped[str] = mapped_column(String(36), default="", index=True)
    user_id: Mapped[str] = mapped_column(String(36), default="")
    content: Mapped[str] = mapped_column(Text, default="", comment="反馈内容")
    correction_suggestion: Mapped[str] = mapped_column(Text, default="", comment="修正建议")
    info: Mapped[dict] = mapped_column(JSONType, default=dict, comment="反馈者信息 JSON")

    def __repr__(self) -> str:
        return f"<DocumentFeedback(id={self.id}, node_id={self.node_id})>"
