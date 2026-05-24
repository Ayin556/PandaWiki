"""统计模型 - 对应 Go 版 domain/stat.go"""

from datetime import datetime

from sqlalchemy import String, Integer, BigInteger, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IntPrimaryKey


class StatPage(Base, IntPrimaryKey):
    """页面访问统计表"""
    __tablename__ = "stat_pages"

    kb_id: Mapped[str] = mapped_column(String(36), nullable=False)
    node_id: Mapped[str] = mapped_column(String(36), default="")
    user_id: Mapped[int] = mapped_column(Integer, default=0)
    session_id: Mapped[str] = mapped_column(String(255), default="")
    scene: Mapped[int] = mapped_column(Integer, default=0, comment="1=欢迎,2=详情,3=聊天,4=登录")
    ip: Mapped[str] = mapped_column(String(50), default="")
    ua: Mapped[str] = mapped_column(String(500), default="")
    browser_name: Mapped[str] = mapped_column(String(100), default="")
    browser_os: Mapped[str] = mapped_column(String(100), default="")
    referer: Mapped[str] = mapped_column(String(500), default="")
    referer_host: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)

    def __repr__(self) -> str:
        return f"<StatPage(id={self.id}, kb_id={self.kb_id})>"


class StatPageHour(Base, IntPrimaryKey):
    """小时聚合统计表"""
    __tablename__ = "stat_page_hours"

    kb_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    hour: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ip_count: Mapped[int] = mapped_column(BigInteger, default=0)
    session_count: Mapped[int] = mapped_column(BigInteger, default=0)
    page_visit_count: Mapped[int] = mapped_column(BigInteger, default=0)
    conversation_count: Mapped[int] = mapped_column(BigInteger, default=0)
    geo_count: Mapped[dict] = mapped_column("geo_count", Text, default="{}", comment="地理分布 JSON")
    conversation_distribution: Mapped[dict] = mapped_column("conversation_distribution", Text, default="{}", comment="对话分布 JSON")
    hot_referer_host: Mapped[dict] = mapped_column("hot_referer_host", Text, default="{}", comment="热来源 JSON")
    hot_page: Mapped[dict] = mapped_column("hot_page", Text, default="{}", comment="热页面 JSON")
    hot_browser: Mapped[dict] = mapped_column("hot_browser", Text, default="{}", comment="热浏览器 JSON")
    hot_os: Mapped[dict] = mapped_column("hot_os", Text, default="{}", comment="热操作系统 JSON")

    def __repr__(self) -> str:
        return f"<StatPageHour(id={self.id}, kb_id={self.kb_id})>"


class NodeStats(Base, IntPrimaryKey):
    """节点PV统计表"""
    __tablename__ = "node_stats"

    node_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    pv: Mapped[int] = mapped_column(BigInteger, default=0)

    def __repr__(self) -> str:
        return f"<NodeStats(id={self.id}, node_id={self.node_id}, pv={self.pv})>"
