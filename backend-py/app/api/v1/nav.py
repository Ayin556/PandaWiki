"""栏目管理 API - 对应 Go 版 handler/v1/nav.go"""

from fastapi import APIRouter
from app.api.deps import CurrentUser, DbSession
from app.schemas.nav import NavListResponse, NavAddRequest, NavUpdateRequest, NavDeleteRequest, NavMoveRequest
from app.services.nav import NavService

router = APIRouter()


@router.get("/list", response_model=NavListResponse)
async def nav_list(kb_id: str, user: CurrentUser, db: DbSession):
    """获取栏目列表 - 对应 Go 版 NavHandler.NavList"""
    service = NavService(db)
    navs = await service.get_list(kb_id)
    return NavListResponse(list=navs)


@router.post("/add")
async def nav_add(req: NavAddRequest, user: CurrentUser, db: DbSession):
    """添加栏目 - 对应 Go 版 NavHandler.NavAdd"""
    service = NavService(db)
    await service.add(req)
    return {"message": "Added successfully"}


@router.delete("/delete")
async def nav_delete(kb_id: str, id: str, user: CurrentUser, db: DbSession):
    """删除栏目 - 对应 Go 版 NavHandler.NavDelete"""
    service = NavService(db)
    await service.delete(kb_id, id)
    return {"message": "Deleted successfully"}


@router.patch("/update")
async def nav_update(req: NavUpdateRequest, user: CurrentUser, db: DbSession):
    """更新栏目 - 对应 Go 版 NavHandler.NavUpdate"""
    service = NavService(db)
    await service.update(req)
    return {"message": "Updated successfully"}


@router.post("/move")
async def nav_move(req: NavMoveRequest, user: CurrentUser, db: DbSession):
    """移动栏目排序 - 对应 Go 版 NavHandler.NavMove"""
    service = NavService(db)
    await service.move(req)
    return {"message": "Moved successfully"}
