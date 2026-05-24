"""消息队列基础设施 - NATS JetStream"""

from typing import Any, Callable, Optional

import nats
from nats.aio.client import Client as NATSClient
from nats.js import JetStreamContext
from loguru import logger

from app.core.config import settings

_nats_client: Optional[NATSClient] = None
_js_context: Optional[JetStreamContext] = None


async def init_nats():
    """初始化 NATS 连接"""
    global _nats_client, _js_context
    try:
        _nats_client = await nats.connect(
            settings.MQ_NATS_SERVER,
            password=settings.NATS_PASSWORD or None,
        )
        _js_context = _nats_client.jetstream()
        await _ensure_streams()
        logger.info("NATS connected successfully")
    except Exception as e:
        logger.error(f"NATS connection failed: {e}")


async def close_nats():
    """关闭 NATS 连接"""
    global _nats_client
    if _nats_client:
        await _nats_client.close()
        _nats_client = None


async def _ensure_streams():
    """确保 Stream 存在"""
    if not _js_context:
        return
    try:
        await _js_context.add_stream(
            name="task",
            subjects=[
                "apps.panda-wiki.summary.task",
                "apps.panda-wiki.vector.task",
            ],
            storage="file",
            retain="limits",
            max_age=7 * 24 * 3600,  # 7天
            max_bytes=1024 * 1024 * 1024,  # 1GB
            max_msg_size=50 * 1024 * 1024,  # 50MB
        )
    except nats.js.errors.StreamAlreadyExistsError:
        pass

    try:
        await _js_context.add_stream(
            name="scraper",
            subjects=["apps.panda-wiki.scraper.>"],
            storage="file",
            retain="limits",
            max_age=7 * 24 * 3600,
            max_bytes=1024 * 1024 * 1024,
            max_msg_size=50 * 1024 * 1024,
        )
    except nats.js.errors.StreamAlreadyExistsError:
        pass


async def publish(topic: str, data: bytes) -> None:
    """发布消息"""
    if _js_context:
        await _js_context.publish(topic, data)


async def subscribe(topic: str, handler: Callable, durable_name: str) -> None:
    """订阅消息"""
    if _js_context:
        await _js_context.subscribe(
            topic,
            durable=durable_name,
            cb=handler,
        )


async def get_nats() -> NATSClient:
    """获取 NATS 客户端"""
    if _nats_client is None:
        await init_nats()
    return _nats_client
