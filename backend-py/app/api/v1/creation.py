"""AI创作 API - 对应 Go 版 handler/v1/creation.go"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.api.deps import CurrentUser, DbSession
from app.services.creation import CreationService

router = APIRouter()


@router.post("/text")
async def text_creation(req: dict, user: CurrentUser, db: DbSession):
    """AI文本创作 (SSE流式) - 对应 Go 版 CreationHandler.Text"""
    service = CreationService(db)
    return StreamingResponse(
        service.text_creation(req),
        media_type="text/event-stream",
    )


@router.post("/tab-complete")
async def tab_complete(req: dict, user: CurrentUser, db: DbSession):
    """AI Tab补全 - 对应 Go 版 CreationHandler.TabComplete"""
    service = CreationService(db)
    result = await service.tab_complete(req)
    return result
