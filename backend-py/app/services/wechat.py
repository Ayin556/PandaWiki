"""微信服务 - 对应 Go 版 usecase/wechat_app.go + wechat_service.go"""

import hashlib

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession


class WechatService:
    """微信业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def verify_url_service(
        self, kb_id: str, signature: str, timestamp: str, nonce: str, echostr: str
    ) -> str:
        """微信客服URL验证 - 对应 Go 版 VerifyURLService"""
        token = await self._get_wechat_token(kb_id, "service")
        if not token:
            return echostr

        if self._check_signature(token, signature, timestamp, nonce):
            return echostr
        return ""

    async def verify_url_app(
        self, kb_id: str, signature: str, timestamp: str, nonce: str, echostr: str
    ) -> str:
        """企业微信URL验证 - 对应 Go 版 VerifyURLApp"""
        token = await self._get_wechat_token(kb_id, "app")
        if not token:
            return echostr

        if self._check_signature(token, signature, timestamp, nonce):
            return echostr
        return ""

    async def _get_wechat_token(self, kb_id: str, wechat_type: str) -> str:
        """获取微信 Token 配置"""
        from sqlalchemy import select
        from app.models.app import App

        app_type = 5 if wechat_type == "service" else 6  # 5=微信, 6=企微
        result = await self.db.execute(
            select(App).where(App.kb_id == kb_id, App.type == app_type)
        )
        app = result.scalar_one_or_none()
        if app and app.settings:
            settings = app.settings or {}
            if wechat_type == "service":
                return settings.get("wechat_service", {}).get("token", "")
            return settings.get("token", "")
        return ""

    @staticmethod
    def _check_signature(token: str, signature: str, timestamp: str, nonce: str) -> bool:
        """验证微信签名"""
        if not token:
            return False
        params = sorted([token, timestamp, nonce])
        hash_str = hashlib.sha1("".join(params).encode()).hexdigest()
        return hash_str == signature
