"""贡献管理 API - 对应 Go 版 Pro /api/pro/v1/contribute/*"""

from datetime import datetime, timezone

from fastapi import APIRouter, Query
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select, func

from app.api.deps import CurrentUser, DbSession
from app.models.contribute import Contribute
from app.models.auth import Auth

router = APIRouter()


class ContributeAuditReq(BaseModel):
    id: str
    kb_id: str
    nav_id: str = ""
    parent_id: str = ""
    position: float = 0
    status: str  # "approved" | "rejected"


@router.get("/list")
async def list_contributes(
    user: CurrentUser,
    db: DbSession,
    kb_id: str = Query(..., description="知识库ID"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="状态过滤: pending/approved/rejected"),
    auth_name: str | None = Query(None, description="提交人名称过滤"),
    node_name: str | None = Query(None, description="文档名称过滤"),
):
    """获取贡献列表"""
    query = select(Contribute).where(Contribute.kb_id == kb_id)

    if status:
        query = query.where(Contribute.status == status)
    if auth_name:
        # auth_name 过滤需要通过 auths 表关联查询
        auth_result = await db.execute(
            select(Auth.id).where(Auth.kb_id == kb_id, Auth.user_info["username"].astext.ilike(f"%{auth_name}%"))
        )
        auth_ids = [r[0] for r in auth_result.fetchall()]
        if auth_ids:
            query = query.where(Contribute.auth_id.in_(auth_ids))
        else:
            return {"list": [], "total": 0}
    if node_name:
        query = query.where(Contribute.name.ilike(f"%{node_name}%"))

    # 查询总数
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # 分页查询
    result = await db.execute(
        query.order_by(Contribute.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    items = result.scalars().all()

    # 批量查询 auth_name
    auth_ids_set = set()
    for item in items:
        if item.auth_id is not None:
            auth_ids_set.add(item.auth_id)
    auth_name_map = {}
    if auth_ids_set:
        auth_result2 = await db.execute(select(Auth).where(Auth.id.in_(auth_ids_set)))
        for a in auth_result2.scalars().all():
            ui = a.user_info or {}
            auth_name_map[a.id] = ui.get("username", "")

    data = []
    for item in items:
        meta = item.meta or {}
        auth_name = auth_name_map.get(item.auth_id, "") if item.auth_id else ""
        data.append({
            "id": item.id,
            "kb_id": item.kb_id,
            "node_id": item.node_id,
            "node_name": item.name,
            "contribute_name": item.name,
            "status": item.status,
            "type": item.type,
            "auth_id": item.auth_id,
            "auth_name": auth_name,
            "remote_ip": item.remote_ip,
            "reason": item.reason,
            "meta": {
                "content_type": meta.get("content_type", ""),
                "emoji": meta.get("emoji", ""),
                "doc_width": meta.get("doc_width", ""),
            },
            "ip_address": {
                "ip": item.remote_ip,
                "country": "",
                "province": "",
                "city": "",
            },
            "audit_user_id": item.audit_user_id,
            "audit_time": item.audit_time.isoformat() if item.audit_time else "",
            "created_at": item.created_at.isoformat() if item.created_at else "",
            "updated_at": item.updated_at.isoformat() if item.updated_at else "",
        })

    return {"list": data, "total": total}


@router.get("/detail")
async def get_contribute_detail(
    user: CurrentUser,
    db: DbSession,
    id: str = Query(..., description="贡献ID"),
    kb_id: str = Query(..., description="知识库ID"),
):
    """获取贡献详情"""
    result = await db.execute(
        select(Contribute).where(Contribute.id == id, Contribute.kb_id == kb_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Contribute not found")

    meta = item.meta or {}
    # 查询 auth_name
    auth_name = ""
    if item.auth_id is not None:
        auth_result = await db.execute(select(Auth).where(Auth.id == item.auth_id))
        auth_user = auth_result.scalar_one_or_none()
        if auth_user:
            ui = auth_user.user_info or {}
            auth_name = ui.get("username", "")

    resp: dict = {
        "id": item.id,
        "kb_id": item.kb_id,
        "node_id": item.node_id,
        "node_name": item.name,
        "content": item.content,
        "status": item.status,
        "type": item.type,
        "auth_id": item.auth_id,
        "auth_name": auth_name,
        "reason": item.reason,
        "meta": {
            "content_type": meta.get("content_type", ""),
            "emoji": meta.get("emoji", ""),
            "doc_width": meta.get("doc_width", ""),
        },
        "audit_user_id": item.audit_user_id,
        "audit_time": item.audit_time.isoformat() if item.audit_time else "",
        "created_at": item.created_at.isoformat() if item.created_at else "",
        "updated_at": item.updated_at.isoformat() if item.updated_at else "",
    }

    # edit 类型时返回原始 node 信息
    if item.type == "edit" and item.node_id:
        from app.models.node import Node
        node_result = await db.execute(select(Node).where(Node.id == item.node_id))
        node = node_result.scalar_one_or_none()
        if node:
            node_meta = node.meta or {} if hasattr(node, 'meta') else {}
            resp["original_node"] = {
                "id": node.id,
                "name": node.name if hasattr(node, 'name') else "",
                "content": node.content if hasattr(node, 'content') else "",
                "meta": {
                    "content_type": node_meta.get("content_type", ""),
                    "emoji": node_meta.get("emoji", ""),
                    "doc_width": node_meta.get("doc_width", ""),
                },
            }

    return resp


@router.post("/audit")
async def audit_contribute(
    req: ContributeAuditReq,
    user: CurrentUser,
    db: DbSession,
):
    """审核贡献 - 通过或拒绝"""
    result = await db.execute(
        select(Contribute).where(Contribute.id == req.id, Contribute.kb_id == req.kb_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Contribute not found")

    item.status = req.status
    item.audit_user_id = user.id if user else ""
    item.audit_time = datetime.now(timezone.utc)

    if req.status == "approved":
        # 审核通过 - 如果是 add 类型，创建新文档
        # 如果是 edit 类型，更新原文档内容
        # 简化实现：仅更新状态，实际文档操作需要更复杂的逻辑
        logger.info(f"Approved contribute: {req.id}")
    else:
        logger.info(f"Rejected contribute: {req.id}")

    await db.commit()
    return {"message": f"Contribute {req.status}"}
