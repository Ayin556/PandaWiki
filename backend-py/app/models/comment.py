"""评论模型 - 对应 Go 版 domain/comment.go"""

from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey


class Comment(Base, UUIDPrimaryKey):
    """评论表"""
    __tablename__ = "comments"

    kb_id: Mapped[str] = mapped_column(String(36), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), default="")
    node_id: Mapped[str] = mapped_column(String(36), default="", index=True)
    info: Mapped[dict] = mapped_column(
        "info", Text,
        comment="评论者信息 JSON",
    )
    parent_id: Mapped[str] = mapped_column(String(36), default="")
    root_id: Mapped[str] = mapped_column(String(36), default="")
    content: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[int] = mapped_column(Integer, default=0, comment="-1=拒绝,0=待审,1=通过")
    pic_urls: Mapped[str] = mapped_column(Text, default="[]", comment="图片URL JSON数组")
    created_at: Mapped[str] = mapped_column(String(50), default="")

    def __repr__(self) -> str:
        return f"<Comment(id={self.id}, node_id={self.node_id})>"
