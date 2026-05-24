"""前台栏目 API"""

from fastapi import APIRouter
from app.api.deps import DbSession, KbId
from app.services.nav import NavService

router = APIRouter()


@router.get("/list")
async def share_nav_list(kb_id: KbId, db: DbSession):
    """获取前台栏目列表 - 对应 Go 版 ShareNavHandler.ShareNavList"""
    service = NavService(db)
    return await service.get_release_list(kb_id)
