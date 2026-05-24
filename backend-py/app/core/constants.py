"""PandaWiki 常量定义 - 对应 Go 版 consts/ 目录"""

from enum import Enum, IntEnum


# ==================== 用户角色 ====================
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


# ==================== 许可证版本 ====================
class LicenseEdition(IntEnum):
    FREE = 0
    PROFESSION = 1
    ENTERPRISE = 2
    BUSINESS = 3


# ==================== 应用类型 ====================
class AppType(IntEnum):
    """应用类型 - 对应 Go 版 AppType"""
    WEB = 1
    WIDGET = 2
    DINGTALK = 3
    FEISHU = 4
    WECHAT = 5
    WECOM = 6
    DISCORD = 7
    WECHAT_OFFICIAL_ACCOUNT = 8
    OPENAI_API = 9
    LARK = 10
    MCP_SERVER = 11


# ==================== 认证来源类型 ====================
class SourceType(str, Enum):
    """认证来源类型"""
    SIMPLE = "simple"
    GITHUB = "github"
    DINGTALK = "dingtalk"
    FEISHU = "feishu"
    WECOM = "wecom"
    CAS = "cas"
    LDAP = "ldap"
    WIDGET = "widget"
    DINGTALK_BOT = "dingtalk_bot"
    FEISHU_BOT = "feishu_bot"
    LARK_BOT = "lark_bot"
    DISCORD_BOT = "discord_bot"
    WECHAT_BOT = "wechat_bot"
    WECHAT_SERVICE = "wechat_service"
    WECHAT_OFFICIAL_ACCOUNT = "wechat_official_account"
    OPENAI_API_BOT = "openai_api_bot"
    WECOM_AI_BOT = "wecom_ai_bot"


# ==================== 认证方式 ====================
class AuthType(str, Enum):
    SIMPLE = "simple"
    ENTERPRISE = "enterprise"


# ==================== 节点类型 ====================
class NodeType(IntEnum):
    FOLDER = 1
    DOCUMENT = 2


# ==================== 节点状态 ====================
class NodeStatus(IntEnum):
    UNRELEASED = 0     # 未发布
    UPDATED = 1        # 已更新未发布
    PUBLISHED = 2      # 已发布


# ==================== 节点权限 ====================
class NodeAccessPerm(str, Enum):
    OPEN = "open"
    PARTIAL = "partial"
    CLOSED = "closed"


class NodePermName(str, Enum):
    VISIBLE = "visible"
    VISITABLE = "visitable"
    ANSWERABLE = "answerable"


# ==================== RAG 信息状态 ====================
class NodeRagInfoStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    FAILED = "FAILED"
    SUCCEEDED = "SUCCEEDED"
    REINDEX = "REINDEX"


# ==================== 模型类型 ====================
class ModelType(str, Enum):
    CHAT = "chat"
    EMBEDDING = "embedding"
    RERANK = "rerank"
    ANALYSIS = "analysis"
    ANALYSIS_VL = "analysis-vl"


# ==================== 模型设置模式 ====================
class ModelSettingMode(str, Enum):
    MANUAL = "manual"
    AUTO = "auto"


# ==================== 爬虫数据源 ====================
class CrawlerSource(str, Enum):
    FILE = "file"
    URL = "url"
    FEISHU = "feishu"
    DINGTALK = "dingtalk"
    NOTION = "notion"
    YUQUE = "yuque"
    SIYUAN = "siyuan"
    MINDOC = "mindoc"
    WIKIJS = "wikijs"
    CONFLUENCE = "confluence"
    EPUB = "epub"
    SITEMAP = "sitemap"
    RSS = "rss"


class CrawlerSourceType(str, Enum):
    FILE = "file"
    URL = "url"
    KEY = "key"


# ==================== 统计场景 ====================
class StatPageScene(IntEnum):
    WELCOME = 1
    DETAIL = 2
    CHAT = 3
    LOGIN = 4


# ==================== 统计天数 ====================
class StatDay:
    DAY_1 = 1
    DAY_7 = 7
    DAY_30 = 30
    DAY_90 = 90


# ==================== 评论状态 ====================
class CommentStatus(IntEnum):
    REJECTED = -1
    PENDING = 0
    APPROVED = 1


# ==================== 投稿状态 ====================
class ContributeStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ContributeType(str, Enum):
    ADD = "add"
    EDIT = "edit"


# ==================== 应用设置常量 ====================
class CopySetting(str, Enum):
    NONE = "none"
    APPEND = "append"
    DISABLED = "disabled"


class WatermarkSetting(str, Enum):
    HIDDEN = "hidden"
    VISIBLE = "visible"


class HomePageSetting(str, Enum):
    DOC = "doc"
    CUSTOM = "custom"


# ==================== 系统设置键 ====================
class SystemSettingKey(str, Enum):
    MODEL_SETTING_MODE = "model_setting_mode"
    UPLOAD = "upload"


# ==================== 消息主题 ====================
class MQTopic:
    VECTOR_TASK = "apps.panda-wiki.vector.task"
    SUMMARY_TASK = "apps.panda-wiki.summary.task"
    ANYDOC_EXPORT = "anydoc.persistence.doc.task.export"
    RAG_DOC_UPDATE = "raglite.events.doc.update"
