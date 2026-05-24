"""微信服务 - 对应 Go 版 usecase/wechat_app.go + wechat_service.go"""

from sqlalchemy.ext.asyncio import AsyncSession


class WechatService:
    """微信业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def verify_url_service(self, kb_id: str, signature: str, timestamp: str, nonce: str, echostr: str) -> str:
        """微信客服URL验证"""
        # TODO: 实现签名验证
        return echostr

    async def verify_url_app(self, kb_id: str, signature: str, timestamp: str, nonce: str, echostr: str) -> str:
        """企业微信URL验证"""
        # TODO: 实现签名验证
        return echostr
