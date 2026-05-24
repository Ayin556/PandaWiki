"""栏目/导航模型 - 对应 Go 版 domain/nav.go"""

from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, CreatedAtMixin, UUIDPrimaryKey


class Nav(Base, UUIDPrimaryKey, TimestampMixin):
    """栏目/导航表"""
    __tablename__ = "navs"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    kb_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_bases.id"), nullable=False)
    position: Mapped[float] = mapped_column(Float, default=0.0)

    # 关系
    knowledge_base: Mapped["KnowledgeBase"] = relationship(back_populates="navs")  # noqa: F821
    releases: Mapped[list["NavRelease"]] = relationship(back_populates="nav", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Nav(id={self.id}, name={self.name}, kb_id={self.kb_id})>"


class NavRelease(Base, UUIDPrimaryKey, CreatedAtMixin):
    """栏目发布版本表"""
    __tablename__ = "nav_releases"

    nav_id: Mapped[str] = mapped_column(String(36), ForeignKey("navs.id"), nullable=False)
    release_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    kb_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    position: Mapped[float] = mapped_column(Float, default=0.0)

    # 关系
    nav: Mapped["Nav"] = relationship(back_populates="releases")

    def __repr__(self) -> str:
        return f"<NavRelease(id={self.id}, nav_id={self.nav_id})>"
