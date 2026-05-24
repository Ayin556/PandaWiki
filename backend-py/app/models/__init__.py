"""SQLAlchemy ORM 模型 - 对应 Go 版 domain/ 目录

所有数据库实体模型，映射到 Go 版的27张数据库表。
"""

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey, IntPrimaryKey
from app.models.user import User, KBUser
from app.models.knowledge_base import KnowledgeBase, KBRelease, KBReleaseNodeRelease
from app.models.app import App
from app.models.auth import Auth, AuthGroup, AuthConfig
from app.models.nav import Nav, NavRelease
from app.models.node import Node, NodeRelease, NodeReleaseBackup, NodeAuthGroup
from app.models.model import Model
from app.models.conversation import Conversation, ConversationMessage, ConversationReference
from app.models.comment import Comment
from app.models.stat import StatPage, StatPageHour, NodeStats
from app.models.setting import Setting, SystemSetting
from app.models.api_token import APIToken

__all__ = [
    # Base
    "Base", "TimestampMixin", "UUIDPrimaryKey", "IntPrimaryKey",
    # User
    "User", "KBUser",
    # KnowledgeBase
    "KnowledgeBase", "KBRelease", "KBReleaseNodeRelease",
    # App
    "App",
    # Auth
    "Auth", "AuthGroup", "AuthConfig",
    # Nav
    "Nav", "NavRelease",
    # Node
    "Node", "NodeRelease", "NodeReleaseBackup", "NodeAuthGroup",
    # Model
    "Model",
    # Conversation
    "Conversation", "ConversationMessage", "ConversationReference",
    # Comment
    "Comment",
    # Stat
    "StatPage", "StatPageHour", "NodeStats",
    # Setting
    "Setting", "SystemSetting",
    # API Token
    "APIToken",
]
