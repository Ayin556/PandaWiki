"""PoW 验证码引擎 - 兼容 Go 版 github.com/ackcoder/go-cap

实现与 go-cap 完全一致的 Proof-of-Work 验证码协议，
使前端 @cap.js/widget 库可以无缝对接 Python 后端。
"""

import hashlib
import os
import struct
import time
import threading
from typing import Optional

from loguru import logger


# FNV-1a 32-bit 常量
_FNV_OFFSET32 = 0x811C9DC5
_FNV_PRIME32 = 0x01000193
_UINT32_MASK = 0xFFFFFFFF


def _fnv1a32(data: str) -> int:
    """FNV-1a 32-bit 哈希算法，与 Go 的 fnv.New32a() 一致"""
    h = _FNV_OFFSET32
    for b in data.encode("utf-8"):
        h ^= b
        h = (h * _FNV_PRIME32) & _UINT32_MASK
    return h


def _prng(seed: str, length: int) -> str:
    """确定性伪随机数生成器 - 与 Go 版 prng() 完全一致

    基于 FNV-1a 种子和 Xorshift 变换生成指定长度的十六进制字符串。
    """
    state = _fnv1a32(seed)
    result = []
    while len("".join(result)) < length:
        # Xorshift 变换
        state ^= (state << 13) & _UINT32_MASK
        state ^= (state >> 17) & _UINT32_MASK
        state ^= (state << 5) & _UINT32_MASK
        state &= _UINT32_MASK
        result.append(f"{state:08x}")
    return "".join(result)[:length]


def _generate_random_hex(length: int) -> str:
    """生成指定长度的随机十六进制字符串"""
    n_bytes = (length + 1) // 2
    return os.urandom(n_bytes).hex()[:length]


def _calculate_hash_hex(input_str: str) -> str:
    """计算 SHA256 哈希的十六进制字符串"""
    return hashlib.sha256(input_str.encode("utf-8")).hexdigest()


class _MemoryStorage:
    """内存存储 - 对应 Go 版 MemoryStorage"""

    def __init__(self, cleanup_interval: int = 300):
        self._challenges: dict[str, int] = {}  # token -> expires_ts (秒级)
        self._tokens: dict[str, int] = {}  # key -> expires_ts (秒级)
        self._lock = threading.Lock()
        self._cleanup_interval = cleanup_interval
        # 启动定期清理
        self._stop_event = threading.Event()
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()

    def _cleanup_loop(self):
        """定期清理过期数据"""
        while not self._stop_event.wait(self._cleanup_interval):
            self.cleanup()

    def set_challenge(self, token: str, expires_ts: int) -> None:
        with self._lock:
            self._challenges[token] = expires_ts

    def get_challenge(self, token: str, delete: bool = False) -> tuple[int, bool]:
        with self._lock:
            if token not in self._challenges:
                return 0, False
            ts = self._challenges[token]
            if delete:
                del self._challenges[token]
            return ts, True

    def set_token(self, key: str, expires_ts: int) -> None:
        with self._lock:
            self._tokens[key] = expires_ts

    def get_token(self, key: str, delete: bool = False) -> tuple[int, bool]:
        with self._lock:
            if key not in self._tokens:
                return 0, False
            ts = self._tokens[key]
            if delete:
                del self._tokens[key]
            return ts, True

    def cleanup(self) -> None:
        now = int(time.time())
        with self._lock:
            expired_keys = [k for k, v in self._challenges.items() if v < now]
            for k in expired_keys:
                del self._challenges[k]
            expired_keys = [k for k, v in self._tokens.items() if v < now]
            for k in expired_keys:
                del self._tokens[k]


class CapCaptcha:
    """PoW 验证码 - 对应 Go 版 gocap.Cap

    配置参数与 PandaWiki Go 版 captcha.go 一致:
    - WithChallenge(50, 32, 3): count=50, size=32, difficulty=3
    - WithChallengeExpires(120): 挑战过期2分钟
    - WithTokenExpires(300): 令牌过期5分钟
    """

    def __init__(
        self,
        challenge_token_size: int = 25,
        challenge_count: int = 50,
        challenge_size: int = 32,
        challenge_difficulty: int = 3,
        challenge_expires: int = 120,
        token_size: int = 15,
        token_id_size: int = 8,
        token_expires: int = 300,
        token_verify_once: bool = True,
    ):
        self.challenge_token_size = challenge_token_size
        self.challenge_count = challenge_count
        self.challenge_size = challenge_size
        self.challenge_difficulty = challenge_difficulty
        self.challenge_expires = challenge_expires
        self.token_size = token_size
        self.token_id_size = token_id_size
        self.token_expires = token_expires
        self.token_verify_once = token_verify_once
        self._storage = _MemoryStorage()

    def create_challenge(self) -> dict:
        """创建质询数据 - 对应 Go 版 Cap.CreateChallenge

        返回格式:
        {
            "token": "hex_string",
            "expires": 毫秒级时间戳,
            "challenge": {"c": count, "s": size, "d": difficulty}
        }
        """
        exp = int(time.time()) + self.challenge_expires
        token = _generate_random_hex(self.challenge_token_size)

        self._storage.set_challenge(token, exp)

        return {
            "token": token,
            "expires": exp * 1000,
            "challenge": {
                "c": self.challenge_count,
                "s": self.challenge_size,
                "d": self.challenge_difficulty,
            },
        }

    def redeem_challenge(self, token: str, solutions: list[int]) -> dict:
        """工作量证明兑换验证令牌 - 对应 Go 版 Cap.RedeemChallenge

        验证逻辑:
        1. 校验 token 有效且未过期
        2. 对每个挑战项 i:
           - 构造 b = token + str(i+1) + 'd'
           - target = prng(b, difficulty)
           - salt = prng(b[:-1], size)
           - hash = sha256hex(salt + str(solutions[i]))
           - 检查 hash 是否以 target 开头
        3. 生成验证令牌并返回

        返回格式:
        {"success": true/false, "token": "...", "expires": ..., "message": "..."}
        """
        # 校验 token 长度
        if not token or len(token) != self.challenge_token_size:
            return {"success": False, "message": "invalid challenge body"}

        # 校验 solutions 数量
        if len(solutions) < self.challenge_count:
            return {"success": False, "message": "invalid solutions"}

        # 校验 token 有效且未过期
        exp_ts, exists = self._storage.get_challenge(token, delete=True)
        if not exists or exp_ts < int(time.time()):
            return {"success": False, "message": "challenge expired"}

        # 逐项验证 PoW 解
        for i in range(self.challenge_count):
            # 构造校验参数 b = token_bytes + str(i+1) + 'd'
            b = f"{token}{i + 1}d"
            # target = prng(b, difficulty)
            target = _prng(b, self.challenge_difficulty)
            # salt = prng(b[:-1], size)  (去掉末尾 'd')
            salt = _prng(b[:-1], self.challenge_size)
            # hash = sha256hex(salt + str(solutions[i]))
            hash_hex = _calculate_hash_hex(f"{salt}{solutions[i]}")

            if not hash_hex.startswith(target):
                return {"success": False, "message": "invalid solutions"}

        # 生成验证令牌
        vertoken = _generate_random_hex(self.token_size)
        vid = _generate_random_hex(self.token_id_size)
        vhash = _calculate_hash_hex(vertoken)
        exp = int(time.time()) + self.token_expires

        # 存储验证令牌 (key = id:hash)
        self._storage.set_token(f"{vid}:{vhash}", exp)

        # 返回验证令牌 (token = id:vertoken)
        return {
            "success": True,
            "token": f"{vid}:{vertoken}",
            "expires": exp * 1000,
        }

    def validate_token(self, token: str) -> bool:
        """检查验证令牌 - 对应 Go 版 Cap.ValidateToken"""
        if not token:
            return False

        parts = token.split(":")
        if len(parts) != 2:
            return False

        vid, vertoken = parts[0], parts[1]
        vhash = _calculate_hash_hex(vertoken)
        key = f"{vid}:{vhash}"

        exp_ts, exists = self._storage.get_token(key, delete=self.token_verify_once)
        if not exists or exp_ts < int(time.time()):
            return False

        return True


# 全局单例 - 与 Go 版 captcha.NewCaptcha() 配置一致
captcha = CapCaptcha(
    challenge_count=50,
    challenge_size=32,
    challenge_difficulty=3,
    challenge_expires=120,
    token_expires=300,
)
