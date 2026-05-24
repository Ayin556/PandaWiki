"""文档节点管理 API - 对应 Go 版 handler/v1/node.go"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DbSession
from app.schemas.node import (
    NodeCreateRequest, NodeUpdateRequest, NodeDetailResponse,
    NodeListResponse, NodeListGroupNavResponse, NodeStatsResponse,
    NodeActionRequest, NodeMoveRequest, NodeMoveNavRequest,
    BatchMoveRequest, NodeSummaryRequest, NodePermissionResponse,
    NodePermissionEditRequest,
)
from app.services.node import NodeService

router = APIRouter()


@router.get("/list", response_model=NodeListResponse)
async def get_node_list(kb_id: str, nav_id: str = "", search: str = "", user: CurrentUser = None, db: DbSession = None):
    """获取文档列表 - 对应 Go 版 NodeHandler.GetNodeList"""
    service = NodeService(db)
    nodes = await service.get_node_list(kb_id=kb_id, nav_id=nav_id, search=search)
    return NodeListResponse(list=nodes)


@router.get("/list/group/nav", response_model=NodeListGroupNavResponse)
async def get_node_list_group_nav(kb_id: str, search: str = "", user: CurrentUser = None, db: DbSession = None):
    """按栏目分组的文档列表 - 对应 Go 版 NodeHandler.NodeListGroupNav"""
    service = NodeService(db)
    result = await service.get_node_list_group_nav(kb_id=kb_id, search=search)
    return result


@router.get("/stats", response_model=NodeStatsResponse)
async def get_node_stats(kb_id: str, user: CurrentUser, db: DbSession):
    """获取文档统计 - 对应 Go 版 NodeHandler.NodeStats"""
    service = NodeService(db)
    return await service.get_node_stats(kb_id)


@router.post("")
async def create_node(req: NodeCreateRequest, user: CurrentUser, db: DbSession):
    """创建文档 - 对应 Go 版 NodeHandler.CreateNode"""
    service = NodeService(db)
    node_id = await service.create_node(req, user.id if user else "")
    return {"id": node_id}


@router.get("/detail", response_model=NodeDetailResponse)
async def get_node_detail(id: str, kb_id: str, format: str = "markdown", user: CurrentUser = None, db: DbSession = None):
    """获取文档详情 - 对应 Go 版 NodeHandler.GetNodeDetail"""
    service = NodeService(db)
    node = await service.get_node_detail(kb_id=kb_id, node_id=id, format=format)
    return node


@router.put("/detail")
async def update_node_detail(req: NodeUpdateRequest, user: CurrentUser, db: DbSession):
    """更新文档详情 - 对应 Go 版 NodeHandler.UpdateNodeDetail"""
    service = NodeService(db)
    await service.update_node(req, user.id if user else "")
    return {"message": "Updated successfully"}


@router.post("/summary")
async def summary_node(req: NodeSummaryRequest, user: CurrentUser, db: DbSession):
    """异步生成文档摘要 - 对应 Go 版 NodeHandler.SummaryNode"""
    service = NodeService(db)
    await service.summary_node(req)
    return {"message": "Summary task created"}


@router.post("/summary/stream")
async def summary_node_stream(req: NodeSummaryRequest, user: CurrentUser, db: DbSession):
    """流式生成文档摘要 (SSE) - 对应 Go 版 NodeHandler.SummaryNodeStream"""
    service = NodeService(db)
    return StreamingResponse(
        service.stream_summary_node(req),
        media_type="text/event-stream",
    )


@router.post("/action")
async def node_action(req: NodeActionRequest, user: CurrentUser, db: DbSession):
    """文档操作 - 对应 Go 版 NodeHandler.NodeAction"""
    service = NodeService(db)
    await service.node_action(req)
    return {"message": "Action completed"}


@router.post("/move")
async def move_node(req: NodeMoveRequest, user: CurrentUser, db: DbSession):
    """移动文档 - 对应 Go 版 NodeHandler.MoveNode"""
    service = NodeService(db)
    await service.move_node(req)
    return {"message": "Moved successfully"}


@router.post("/move/nav")
async def move_node_nav(req: NodeMoveNavRequest, user: CurrentUser, db: DbSession):
    """移动文档到其他栏目 - 对应 Go 版 NodeHandler.NodeMoveNav"""
    service = NodeService(db)
    await service.move_node_nav(req)
    return {"message": "Moved successfully"}


@router.post("/batch_move")
async def batch_move_node(req: BatchMoveRequest, user: CurrentUser, db: DbSession):
    """批量移动文档 - 对应 Go 版 NodeHandler.BatchMoveNode"""
    service = NodeService(db)
    await service.batch_move_node(req)
    return {"message": "Moved successfully"}


@router.get("/recommend_nodes")
async def recommend_nodes(kb_id: str, nav_ids: str = "", node_ids: str = "", user: CurrentUser = None, db: DbSession = None):
    """获取推荐文档 - 对应 Go 版 NodeHandler.RecommendNodes"""
    service = NodeService(db)
    nodes = await service.get_recommend_nodes(kb_id, nav_ids.split(",") if nav_ids else [], node_ids.split(",") if node_ids else [])
    return {"list": nodes}


@router.post("/restudy")
async def node_restudy(req: dict, user: CurrentUser, db: DbSession):
    """文档重新学习 - 对应 Go 版 NodeHandler.NodeRestudy"""
    service = NodeService(db)
    await service.node_restudy(req.get("node_id", ""), req.get("kb_id", ""))
    return {"message": "Restudy started"}


@router.get("/permission", response_model=NodePermissionResponse)
async def node_permission(id: str, kb_id: str, user: CurrentUser, db: DbSession):
    """获取文档权限 - 对应 Go 版 NodeHandler.NodePermission"""
    service = NodeService(db)
    return await service.get_node_permissions(kb_id, id)


@router.patch("/permission/edit")
async def node_permission_edit(req: NodePermissionEditRequest, user: CurrentUser, db: DbSession):
    """编辑文档权限 - 对应 Go 版 NodeHandler.NodePermissionEdit"""
    service = NodeService(db)
    await service.edit_node_permissions(req)
    return {"message": "Permissions updated"}
