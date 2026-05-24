"""前台文档 API"""

from fastapi import APIRouter
from app.api.deps import DbSession
from app.services.node import NodeService

router = APIRouter()


@router.get("/list")
async def share_node_list(kb_id: str, db: DbSession):
    """获取前台文档列表 - 对应 Go 版 ShareNodeHandler.ShareNodeList"""
    service = NodeService(db)
    return await service.get_share_node_list(kb_id)


@router.get("/detail")
async def get_node_detail(id: str, kb_id: str, db: DbSession):
    """获取前台文档详情 - 对应 Go 版 ShareNodeHandler.GetNodeDetail"""
    service = NodeService(db)
    return await service.get_share_node_detail(kb_id, id)
