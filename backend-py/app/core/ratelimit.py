"""基于 Redis 的 IP 限速"""

from datetime import datetime, timedelta, timezone

import redis.asyncio as aioredis

from app.infrastructure.redis import get_redis


class RateLimiter:
    """IP 限速器 - 对应 Go 版 ratelimit/rate_limiter.go"""

    # 限制规则: (时间窗口秒, 最大请求数)
    RULES = [
        (60, 5),       # 1分钟5次
        (900, 10),     # 15分钟10次
        (3600, 15),    # 1小时15次
    ]

    async def is_limited(self, ip: str) -> bool:
        """检查 IP 是否超过限制"""
        redis = await get_redis()
        for window_seconds, max_requests in self.RULES:
            key = f"ratelimit:login:{ip}:{window_seconds}"
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, window_seconds)
            if count > max_requests:
                return True
        return False


rate_limiter = RateLimiter()
