"""前台对话 API - 对应 Go 版 handler/share/chat.go"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.api.deps import DbSession
from app.services.chat import ChatService

router = APIRouter()


@router.post("/message")
async def chat_message(req: dict, db: DbSession):
    """Web对话消息 (SSE流式) - 对应 Go 版 ShareChatHandler.ChatMessage"""
    service = ChatService(db)
    return StreamingResponse(
        service.chat(req),
        media_type="text/event-stream",
    )


@router.post("/search")
async def chat_search(req: dict, db: DbSession):
    """对话搜索 - 对应 Go 版 ShareChatHandler.ChatSearch"""
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
async def chat_widget(req: dict, db: DbSession):
    """Widget对话 (SSE流式) - 对应 Go 版 ShareChatHandler.ChatWidget"""
    service = ChatService(db)
    return StreamingResponse(
        service.chat_widget(req),
        media_type="text/event-stream",
    )


@router.post("/widget/search")
async def widget_search(req: dict, db: DbSession):
    """Widget搜索 - 对应 Go 版 ShareChatHandler.WidgetSearch"""
    service = ChatService(db)
    return await service.widget_search(req)


@router.post("/feedback")
async def feedback(req: dict, db: DbSession):
    """对话反馈 - 对应 Go 版 ShareChatHandler.FeedBack"""
    service = ChatService(db)
    await service.feedback(req)
    return {"message": "Feedback submitted"}
