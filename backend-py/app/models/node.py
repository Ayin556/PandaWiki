"""文档节点模型 - 对应 Go 版 domain/node.go"""

from datetime import datetime

from sqlalchemy import String, Integer, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey, JSONType


class Node(Base, UUIDPrimaryKey, TimestampMixin):
    """文档节点表 - 含多个 JSONB 字段"""
    __tablename__ = "nodes"

    kb_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_bases.id"), nullable=False, index=True)
    nav_id: Mapped[str] = mapped_column(String(36), default="")
    type: Mapped[int] = mapped_column(Integer, default=2, comment="1=文件夹,2=文档")
    status: Mapped[int] = mapped_column(Integer, default=0, comment="0=未发布,1=更新未发布,2=已发布")
    rag_info: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        comment="RAG信息 JSON (status, message, synced_at)",
    )
    name: Mapped[str] = mapped_column(String(255), default="")
    content: Mapped[str] = mapped_column(Text, default="")
    meta: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        comment="元数据 JSON (summary, emoji, content_type)",
    )
    parent_id: Mapped[str] = mapped_column(String(36), default="")
    position: Mapped[float] = mapped_column(Float, default=0.0)
    doc_id: Mapped[str] = mapped_column(String(255), default="", comment="RAG文档ID")
    creator_id: Mapped[str] = mapped_column(String(36), default="")
    editor_id: Mapped[str] = mapped_column(String(36), default="")
    edit_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    permissions: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        comment="权限 JSON (answerable/visitable/visible: open/partial/closed)",
    )

    # 关系
    knowledge_base: Mapped["KnowledgeBase"] = relationship(back_populates="nodes")  # noqa: F821
    releases: Mapped[list["NodeRelease"]] = relationship(back_populates="node", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Node(id={self.id}, name={self.name}, kb_id={self.kb_id})>"


class NodeRelease(Base, UUIDPrimaryKey, TimestampMixin):
    """节点发布版本表"""
    __tablename__ = "node_releases"

    kb_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    publisher_id: Mapped[str] = mapped_column(String(36), default="")
    editor_id: Mapped[str] = mapped_column(String(36), default="")
    node_id: Mapped[str] = mapped_column(String(36), ForeignKey("nodes.id"), nullable=False, index=True)
    doc_id: Mapped[str] = mapped_column(String(255), default="", index=True)
    type: Mapped[int] = mapped_column(Integer, default=2)
    name: Mapped[str] = mapped_column(String(255), default="")
    meta: Mapped[dict] = mapped_column(JSONType, default=dict, comment="元数据 JSON")
    content: Mapped[str] = mapped_column(Text, default="")
    position: Mapped[float] = mapped_column(Float, default=0.0)
    parent_id: Mapped[str] = mapped_column(String(36), default="")

    # 关系
    node: Mapped["Node"] = relationship(back_populates="releases")

    def __repr__(self) -> str:
        return f"<NodeRelease(id={self.id}, node_id={self.node_id})>"


class NodeReleaseBackup(Base, UUIDPrimaryKey, TimestampMixin):
    """节点发布备份表"""
    __tablename__ = "node_release_backup"

    kb_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    publisher_id: Mapped[str] = mapped_column(String(36), default="")
    editor_id: Mapped[str] = mapped_column(String(36), default="")
    node_id: Mapped[str] = mapped_column(String(36), ForeignKey("nodes.id"), nullable=False, index=True)
    doc_id: Mapped[str] = mapped_column(String(255), default="", index=True)
    type: Mapped[int] = mapped_column(Integer, default=2)
    name: Mapped[str] = mapped_column(String(255), default="")
    meta: Mapped[dict] = mapped_column(JSONType, default=dict, comment="元数据 JSON")
    content: Mapped[str] = mapped_column(Text, default="")
    position: Mapped[float] = mapped_column(Float, default=0.0)
    parent_id: Mapped[str] = mapped_column(String(36), default="")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    def __repr__(self) -> str:
        return f"<NodeReleaseBackup(id={self.id}, node_id={self.node_id})>"


class NodeAuthGroup(Base, TimestampMixin):
    """节点-权限组关联表"""
    __tablename__ = "node_auth_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    node_id: Mapped[str] = mapped_column(String(36), nullable=False)
    auth_group_id: Mapped[int] = mapped_column(Integer, nullable=False)
    perm: Mapped[str] = mapped_column(String(50), nullable=False, comment="权限名: visible/visitable/answerable")

    def __repr__(self) -> str:
        return f"<NodeAuthGroup(id={self.id}, node_id={self.node_id}, perm={self.perm})>"
