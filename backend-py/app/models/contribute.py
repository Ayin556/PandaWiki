"""贡献模型 - 对应 Go 版 domain/contribute.go"""

from sqlalchemy import String, Text, Integer, BigInteger, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey, JSONType


class Contribute(Base, UUIDPrimaryKey, TimestampMixin):
    """贡献表 - 用户提交的文档修改/新增请求"""
    __tablename__ = "contributes"

    kb_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    node_id: Mapped[str] = mapped_column(String(36), default="")
    name: Mapped[str] = mapped_column(String(500), default="", comment="贡献标题")
    content: Mapped[str] = mapped_column(Text, default="", comment="贡献内容")
    meta: Mapped[dict] = mapped_column(JSONType, default=dict, comment="节点元信息 JSON")
    reason: Mapped[str] = mapped_column(Text, default="", comment="修改原因")
    type: Mapped[str] = mapped_column(String(20), default="add", comment="add/edit")
    status: Mapped[str] = mapped_column(String(20), default="pending", comment="pending/approved/rejected")
    auth_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True, comment="认证用户ID")
    remote_ip: Mapped[str] = mapped_column(String(100), default="")
    audit_user_id: Mapped[str] = mapped_column(String(36), default="", comment="审核人ID")
    audit_time: Mapped[str | None] = mapped_column(DateTime(timezone=False), nullable=True)

    def __repr__(self) -> str:
        return f"<Contribute(id={self.id}, kb_id={self.kb_id}, status={self.status})>"
