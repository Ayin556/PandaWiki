"""前台统计 API"""

from fastapi import APIRouter
from app.api.deps import DbSession
from app.services.stat import StatService

router = APIRouter()


@router.post("/page")
async def record_page(req: dict, db: DbSession):
    """上报页面访问统计 - 对应 Go 版 ShareStatHandler.RecordPage"""
    service = StatService(db)
    await service.record_page(req)
    return {"message": "Recorded"}
