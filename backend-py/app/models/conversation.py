"""对话模型 - 对应 Go 版 domain/conversation.go"""

from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey, JSONType


class Conversation(Base, UUIDPrimaryKey, TimestampMixin):
    """对话表"""
    __tablename__ = "conversations"

    nonce: Mapped[str] = mapped_column(String(255), default="")
    kb_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    app_id: Mapped[str] = mapped_column(String(36), default="", index=True)
    subject: Mapped[str] = mapped_column(String(500), default="")
    remote_ip: Mapped[str] = mapped_column(String(50), default="")
    info: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        comment="用户信息 JSON",
    )

    # 关系
    messages: Mapped[list["ConversationMessage"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")  # noqa: F821
    references: Mapped[list["ConversationReference"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Conversation(id={self.id}, kb_id={self.kb_id})>"


class ConversationMessage(Base, UUIDPrimaryKey, TimestampMixin):
    """对话消息表"""
    __tablename__ = "conversation_messages"

    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    app_id: Mapped[str] = mapped_column(String(36), default="", index=True)
    kb_id: Mapped[str] = mapped_column(String(36), default="")
    role: Mapped[str] = mapped_column(String(50), nullable=False, comment="user/assistant")
    content: Mapped[str] = mapped_column(Text, default="")
    image_paths: Mapped[list] = mapped_column(
        JSONType,
        default=list,
        comment="图片路径 JSON 数组",
    )
    provider: Mapped[str] = mapped_column(String(100), default="")
    model: Mapped[str] = mapped_column(String(255), default="")
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    remote_ip: Mapped[str] = mapped_column(String(50), default="")
    info: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        comment="反馈信息 JSON (score, type, content)",
    )
    parent_id: Mapped[str] = mapped_column(String(36), default="")

    # 关系
    conversation: Mapped["Conversation"] = relationship(back_populates="messages")  # noqa: F821

    def __repr__(self) -> str:
        return f"<ConversationMessage(id={self.id}, role={self.role})>"


class ConversationReference(Base, TimestampMixin):
    """对话引用表"""
    __tablename__ = "conversation_references"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    app_id: Mapped[str] = mapped_column(String(36), default="")
    node_id: Mapped[str] = mapped_column(String(36), default="")
    name: Mapped[str] = mapped_column(String(255), default="")
    url: Mapped[str] = mapped_column(String(500), default="")

    # 关系
    conversation: Mapped["Conversation"] = relationship(back_populates="references")  # noqa: F821

    def __repr__(self) -> str:
        return f"<ConversationReference(id={self.id}, node_id={self.node_id})>"
