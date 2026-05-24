"""Redis 基础设施"""

from typing import Optional

import redis.asyncio as aioredis

from app.core.config import settings

_redis: Optional[aioredis.Redis] = None


async def init_redis():
    """初始化 Redis 连接"""
    global _redis
    _redis = aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )


async def close_redis():
    """关闭 Redis 连接"""
    global _redis
    if _redis:
        await _redis.close()
        _redis = None


async def get_redis() -> aioredis.Redis:
    """获取 Redis 客户端"""
    if _redis is None:
        await init_redis()
    return _redis


class CacheManager:
    """缓存管理器 - 对应 Go 版 cache/Cache"""

    async def get_or_set(self, key: str, factory, ttl: int = 1800) -> str:
        """获取缓存或设置缓存"""
        redis = await get_redis()
        value = await redis.get(key)
        if value is not None:
            return value
        value = await factory()
        if value is not None:
            await redis.set(key, value, ex=ttl)
        return value

    async def delete_keys_with_prefix(self, prefix: str) -> int:
        """删除指定前缀的所有键"""
        redis = await get_redis()
        keys = []
        async for key in redis.scan_iter(match=f"{prefix}*"):
            keys.append(key)
        if keys:
            return await redis.delete(*keys)
        return 0

    async def acquire_lock(self, key: str, ttl: int = 10) -> bool:
        """获取分布式锁"""
        redis = await get_redis()
        return await redis.set(key, "1", nx=True, ex=ttl)

    async def release_lock(self, key: str) -> None:
        """释放分布式锁"""
        redis = await get_redis()
        await redis.delete(key)


cache_manager = CacheManager()
