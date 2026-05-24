"""应用模型 - 对应 Go 版 domain/app.go"""

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey, JSONType


class App(Base, UUIDPrimaryKey, TimestampMixin):
    """应用配置表 - 含巨型 JSONB settings 字段"""
    __tablename__ = "apps"

    kb_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_bases.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), default="")
    type: Mapped[int] = mapped_column(Integer, default=1, comment="1=Web,2=Widget,3=钉钉,4=飞书,5=微信,6=企微,7=Discord,8=公众号,9=OpenAI,10=Lark,11=MCP")
    settings: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        comment="应用设置 JSON (巨型JSONB: 标题/图标/机器人配置/主题/水印/评论/反馈等)",
    )

    # 关系
    knowledge_base: Mapped["KnowledgeBase"] = relationship(back_populates="apps")  # noqa: F821

    def __repr__(self) -> str:
        return f"<App(id={self.id}, kb_id={self.kb_id}, type={self.type})>"
