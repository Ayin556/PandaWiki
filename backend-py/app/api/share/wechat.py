"""微信/企业微信 API"""

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.api.deps import DbSession
from app.services.wechat import WechatService

router = APIRouter()


@router.get("/wechat/service")
async def verify_url_wechat_service(signature: str, timestamp: str, nonce: str, echostr: str, kb_id: str = "", db: DbSession = None):
    """微信客服URL验证"""
    service = WechatService(db)
    result = await service.verify_url_service(kb_id, signature, timestamp, nonce, echostr)
    return result


@router.post("/wechat/service")
async def wechat_handler_service(request: Request, kb_id: str = "", db: DbSession = None):
    """微信客服消息处理"""
    # TODO: 实现微信客服消息处理
    return ""


@router.get("/wechat/app")
async def verify_url_wechat_app(signature: str, timestamp: str, nonce: str, echostr: str, kb_id: str = "", db: DbSession = None):
    """企业微信URL验证"""
    service = WechatService(db)
    result = await service.verify_url_app(kb_id, signature, timestamp, nonce, echostr)
    return result


@router.post("/wechat/app")
async def wechat_handler_app(request: Request, kb_id: str = "", db: DbSession = None):
    """企业微信消息处理"""
    # TODO: 实现企业微信消息处理
    return ""


@router.get("/wecom/ai_bot")
async def wecom_ai_bot_verify(signature: str, timestamp: str, nonce: str, echostr: str, kb_id: str = "", db: DbSession = None):
    """企业微信AI机器人URL验证"""
    # TODO: 实现
    return echostr


@router.post("/wecom/ai_bot")
async def wecom_ai_bot_handle(request: Request, kb_id: str = "", db: DbSession = None):
    """企业微信AI机器人消息处理"""
    # TODO: 实现
    return ""
