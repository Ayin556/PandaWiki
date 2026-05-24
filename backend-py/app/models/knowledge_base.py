"""知识库模型 - 对应 Go 版 domain/knowledge_base.go"""

from sqlalchemy import String, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKey, JSONType


class KnowledgeBase(Base, UUIDPrimaryKey, CreatedAtMixin):
    """知识库表"""
    __tablename__ = "knowledge_bases"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dataset_id: Mapped[str] = mapped_column(String(255), default="")
    access_settings: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        comment="访问设置 JSON",
    )

    # 关系
    apps: Mapped[list["App"]] = relationship(back_populates="knowledge_base", cascade="all, delete-orphan")
    navs: Mapped[list["Nav"]] = relationship(back_populates="knowledge_base", cascade="all, delete-orphan")
    nodes: Mapped[list["Node"]] = relationship(back_populates="knowledge_base", cascade="all, delete-orphan")
    releases: Mapped[list["KBRelease"]] = relationship(back_populates="knowledge_base", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<KnowledgeBase(id={self.id}, name={self.name})>"


class KBRelease(Base, UUIDPrimaryKey, CreatedAtMixin):
    """知识库发布版本表"""
    __tablename__ = "kb_releases"

    kb_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_bases.id"), nullable=False, index=True)
    tag: Mapped[str] = mapped_column(String(255), default="")
    message: Mapped[str] = mapped_column(Text, default="")
    publisher_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    # 关系
    knowledge_base: Mapped["KnowledgeBase"] = relationship(back_populates="releases")
    node_releases: Mapped[list["KBReleaseNodeRelease"]] = relationship(back_populates="release", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<KBRelease(id={self.id}, kb_id={self.kb_id}, tag={self.tag})>"


class KBReleaseNodeRelease(Base, UUIDPrimaryKey, CreatedAtMixin):
    """知识库发布-节点发布关联表"""
    __tablename__ = "kb_release_node_releases"

    kb_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_bases.id"), nullable=False, index=True)
    release_id: Mapped[str] = mapped_column(String(36), ForeignKey("kb_releases.id"), nullable=False, index=True)
    node_id: Mapped[str] = mapped_column(String(36), nullable=False)
    node_release_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    nav_id: Mapped[str] = mapped_column(String(36), default="")

    # 关系
    release: Mapped["KBRelease"] = relationship(back_populates="node_releases")

    def __repr__(self) -> str:
        return f"<KBReleaseNodeRelease(id={self.id}, release_id={self.release_id})>"
