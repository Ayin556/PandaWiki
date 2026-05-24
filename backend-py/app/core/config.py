"""PandaWiki 核心配置管理 - 基于 pydantic-settings"""

from enum import IntEnum
from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class LogLevel(str):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class Environment(str):
    DEVELOPMENT = "development"
    PRODUCTION = "production"


class Settings(BaseSettings):
    """应用配置 - 从环境变量和 .env 文件加载"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # 服务器
    HTTP_PORT: int = 8000
    LOG_LEVEL: str = LogLevel.INFO
    ENV: str = Environment.DEVELOPMENT

    # PostgreSQL
    PG_HOST: str = "localhost"
    PG_PORT: int = 5432
    PG_USER: str = "panda-wiki"
    PG_PASSWORD: str = "panda-wiki"
    PG_DB: str = "panda-wiki"
    PG_DSN: Optional[str] = None

    # Redis
    REDIS_ADDR: str = "localhost:6379"
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24

    # 管理员
    ADMIN_PASSWORD: str = ""

    # NATS 消息队列
    MQ_NATS_SERVER: str = "nats://localhost:4222"
    NATS_PASSWORD: str = ""

    # RAG / LangChain
    RAG_BASE_URL: str = ""
    OPENAI_API_KEY: str = ""
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHAT_MODEL: str = "gpt-4o-mini"

    # MinIO / S3
    S3_ENDPOINT: str = "localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "static-file"
    S3_USE_SSL: bool = False

    # Sentry
    SENTRY_ENABLED: bool = False
    SENTRY_DSN: str = ""

    # Caddy
    CADDY_API: str = ""
    CADDY_ENABLED: bool = False

    # 子网前缀
    SUBNET_PREFIX: str = "169.254.15"

    # 只读模式
    READONLY: bool = False

    @property
    def pg_dsn_resolved(self) -> str:
        """获取 PostgreSQL 连接字符串"""
        if self.PG_DSN:
            return self.PG_DSN
        return (
            f"postgresql+asyncpg://{self.PG_USER}:{self.PG_PASSWORD}"
            f"@{self.PG_HOST}:{self.PG_PORT}/{self.PG_DB}"
        )

    @property
    def redis_url(self) -> str:
        """获取 Redis 连接 URL"""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_ADDR}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_ADDR}/{self.REDIS_DB}"

    @property
    def is_development(self) -> bool:
        return self.ENV == Environment.DEVELOPMENT


@lru_cache()
def get_settings() -> Settings:
    """获取全局配置单例"""
    return Settings()


# 便捷访问
settings = get_settings()
