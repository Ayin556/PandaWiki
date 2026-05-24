"""前台对话 API - 对应 Go 版 handler/share/chat.go"""

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.api.deps import DbSession, KbId
from app.core.captcha import captcha
from app.core.exceptions import BadRequestException
from app.services.chat import ChatService

router = APIRouter()


@router.post("/message")
async def chat_message(request: Request, req: dict, kb_id: KbId, db: DbSession):
    """Web对话消息 (SSE流式) - 对应 Go 版 ShareChatHandler.ChatMessage"""
    # 验证 captcha_token
    captcha_token = req.get("captcha_token", "")
    if not captcha.validate_token(captcha_token):
        raise BadRequestException("failed to validate captcha")
    # 注入 kb_id（Go 版: req.KBID = c.Request().Header.Get("X-KB-ID")）
    req["kb_id"] = kb_id
    # 注入客户端 IP（Go 版: req.RemoteIP = c.RealIP()）
    req["remote_ip"] = request.client.host if request.client else ""
    # 注入 app_type（Go 版: app_type query param）
    req.setdefault("app_type", 1)
    service = ChatService(db)
    return StreamingResponse(
        service.chat(req),
        media_type="text/event-stream",
    )


@router.post("/search")
async def chat_search(request: Request, req: dict, kb_id: KbId, db: DbSession):
    """对话搜索 - 对应 Go 版 ShareChatHandler.ChatSearch"""
    # 验证 captcha_token
    captcha_token = req.get("captcha_token", "")
    if not captcha.validate_token(captcha_token):
        raise BadRequestException("failed to validate captcha")
    req["kb_id"] = kb_id
    req["remote_ip"] = request.client.host if request.client else ""
    service = ChatService(db)
    return await service.search(req)


@router.post("/completions")
async def chat_completions(req: dict, db: DbSession):
    """OpenAI API兼容对话接口 - 对应 Go 版 ShareChatHandler.ChatCompletions"""
    service = ChatService(db)
    stream = req.get("stream", False)
    if stream:
        return StreamingResponse(
            service.chat_completions_stream(req),
            media_type="text/event-stream",
        )
    return await service.chat_completions(req)


@router.post("/widget")
async def chat_widget(request: Request, req: dict, kb_id: KbId, db: DbSession):
    """Widget对话 (SSE流式) - 对应 Go 版 ShareChatHandler.ChatWidget"""
    req["kb_id"] = kb_id
    req["remote_ip"] = request.client.host if request.client else ""
    req["app_type"] = 2  # Widget
    service = ChatService(db)
    return StreamingResponse(
        service.chat_widget(req),
        media_type="text/event-stream",
    )


@router.post("/widget/search")
async def widget_search(request: Request, req: dict, kb_id: KbId, db: DbSession):
    """Widget搜索 - 对应 Go 版 ShareChatHandler.WidgetSearch"""
    req["kb_id"] = kb_id
    req["remote_ip"] = request.client.host if request.client else ""
    service = ChatService(db)
    return await service.widget_search(req)


@router.post("/feedback")
async def feedback(req: dict, db: DbSession):
    """对话反馈 - 对应 Go 版 ShareChatHandler.FeedBack"""
    service = ChatService(db)
    await service.feedback(req)
    return {"message": "Feedback submitted"}
