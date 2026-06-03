"""访客权限组 API - 对应 Go 版 Pro /api/pro/v1/auth/group/*"""

from fastapi import APIRouter, Query, HTTPException
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy import select, delete, func

from app.api.deps import CurrentUser, DbSession
from app.models.auth import AuthGroup, Auth

router = APIRouter()


class AuthGroupCreateReq(BaseModel):
    kb_id: str
    name: str = Field(min_length=1, max_length=100)
    ids: list[int] = []  # auth_ids
    parent_id: int | None = None
    position: float = 0.0


class AuthGroupUpdateReq(BaseModel):
    id: int
    kb_id: str
    name: str | None = None
    auth_ids: list[int] | None = None
    parent_id: int | None = None
    position: float | None = None


class AuthGroupMoveReq(BaseModel):
    id: int
    kb_id: str
    parent_id: int | None = None
    prev_id: int | None = None
    next_id: int | None = None


@router.post("/create")
async def create_auth_group(
    req: AuthGroupCreateReq,
    user: CurrentUser,
    db: DbSession,
):
    """创建访客权限组"""
    group = AuthGroup(
        name=req.name,
        kb_id=req.kb_id,
        parent_id=req.parent_id,
        position=req.position,
        auth_ids=req.ids,
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)
    logger.info(f"Created auth group: {group.id}, kb_id={req.kb_id}")
    return {"id": group.id}


@router.get("/list")
async def list_auth_groups(
    user: CurrentUser,
    db: DbSession,
    kb_id: str = Query(...),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """获取访客权限组列表"""
    query = select(AuthGroup).where(AuthGroup.kb_id == kb_id)

    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        query.order_by(AuthGroup.position.asc(), AuthGroup.id.asc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    groups = result.scalars().all()

    data = []
    for g in groups:
        data.append({
            "id": g.id,
            "name": g.name,
            "parent_id": g.parent_id,
            "position": g.position,
            "auth_ids": g.auth_ids or [],
            "count": len(g.auth_ids) if g.auth_ids else 0,
            "created_at": g.created_at.isoformat() if g.created_at else "",
        })

    return {"list": data, "total": total}


@router.get("/tree")
async def get_auth_group_tree(
    user: CurrentUser,
    db: DbSession,
    kb_id: str = Query(...),
):
    """获取访客权限组树形结构"""
    result = await db.execute(
        select(AuthGroup).where(AuthGroup.kb_id == kb_id)
        .order_by(AuthGroup.position.asc(), AuthGroup.id.asc())
    )
    groups = result.scalars().all()

    # 构建树形结构
    group_map = {}
    for g in groups:
        group_map[g.id] = {
            "id": g.id,
            "name": g.name,
            "parent_id": g.parent_id,
            "position": g.position,
            "auth_ids": g.auth_ids or [],
            "count": len(g.auth_ids) if g.auth_ids else 0,
            "sync_id": g.sync_id or "",
            "level": 0,
            "children": [],
        }

    tree = []
    for gid, item in group_map.items():
        pid = item["parent_id"]
        if pid and pid in group_map:
            item["level"] = group_map[pid].get("level", 0) + 1
            group_map[pid]["children"].append(item)
        else:
            tree.append(item)

    return {"list": tree}


@router.get("/detail")
async def get_auth_group_detail(
    user: CurrentUser,
    db: DbSession,
    id: int = Query(...),
    kb_id: str = Query(...),
):
    """获取访客权限组详情"""
    result = await db.execute(
        select(AuthGroup).where(AuthGroup.id == id, AuthGroup.kb_id == kb_id)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Auth group not found")

    # 查询该组包含的认证用户
    auths = []
    if group.auth_ids:
        auth_result = await db.execute(
            select(Auth).where(Auth.id.in_(group.auth_ids))
        )
        for a in auth_result.scalars().all():
            ui = a.user_info or {}
            auths.append({
                "id": a.id,
                "username": ui.get("username", ""),
                "avatar_url": ui.get("avatar_url", ""),
                "ip": a.ip,
                "source_type": a.source_type,
                "created_at": a.created_at.isoformat() if a.created_at else "",
                "last_login_time": a.last_login_time.isoformat() if a.last_login_time else "",
            })

    # 查询子组
    children_result = await db.execute(
        select(AuthGroup).where(AuthGroup.parent_id == id, AuthGroup.kb_id == kb_id)
    )
    children = []
    for c in children_result.scalars().all():
        children.append({
            "id": c.id,
            "name": c.name,
            "parent_id": c.parent_id,
            "position": c.position,
            "auth_ids": c.auth_ids or [],
            "count": len(c.auth_ids) if c.auth_ids else 0,
            "created_at": c.created_at.isoformat() if c.created_at else "",
        })

    # 查询父组
    parent = None
    if group.parent_id:
        p_result = await db.execute(
            select(AuthGroup).where(AuthGroup.id == group.parent_id)
        )
        p = p_result.scalar_one_or_none()
        if p:
            parent = {
                "id": p.id,
                "name": p.name,
                "parent_id": p.parent_id,
                "position": p.position,
                "auth_ids": p.auth_ids or [],
                "count": len(p.auth_ids) if p.auth_ids else 0,
                "created_at": p.created_at.isoformat() if p.created_at else "",
            }

    return {
        "id": group.id,
        "name": group.name,
        "parent_id": group.parent_id,
        "position": group.position,
        "auth_ids": group.auth_ids or [],
        "auths": auths,
        "children": children,
        "parent": parent,
        "created_at": group.created_at.isoformat() if group.created_at else "",
    }


@router.patch("/update")
async def update_auth_group(
    req: AuthGroupUpdateReq,
    user: CurrentUser,
    db: DbSession,
):
    """更新访客权限组"""
    result = await db.execute(
        select(AuthGroup).where(AuthGroup.id == req.id, AuthGroup.kb_id == req.kb_id)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Auth group not found")

    if req.name is not None:
        group.name = req.name
    if req.auth_ids is not None:
        group.auth_ids = req.auth_ids
    if req.parent_id is not None:
        group.parent_id = req.parent_id
    if req.position is not None:
        group.position = req.position

    await db.commit()
    logger.info(f"Updated auth group: {req.id}")
    return None


@router.patch("/move")
async def move_auth_group(
    req: AuthGroupMoveReq,
    user: CurrentUser,
    db: DbSession,
):
    """移动访客权限组"""
    result = await db.execute(
        select(AuthGroup).where(AuthGroup.id == req.id, AuthGroup.kb_id == req.kb_id)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Auth group not found")

    if req.parent_id is not None:
        group.parent_id = req.parent_id

    # 简单的位置调整
    if req.prev_id is not None:
        prev_result = await db.execute(
            select(AuthGroup).where(AuthGroup.id == req.prev_id)
        )
        prev = prev_result.scalar_one_or_none()
        if prev:
            group.position = prev.position - 0.5
    elif req.next_id is not None:
        next_result = await db.execute(
            select(AuthGroup).where(AuthGroup.id == req.next_id)
        )
        nxt = next_result.scalar_one_or_none()
        if nxt:
            group.position = nxt.position + 0.5

    await db.commit()
    logger.info(f"Moved auth group: {req.id}")
    return None


@router.delete("/delete")
async def delete_auth_group(
    user: CurrentUser,
    db: DbSession,
    id: int = Query(...),
    kb_id: str = Query(...),
):
    """删除访客权限组"""
    # 删除子组的 parent_id 引用
    await db.execute(
        select(AuthGroup)  # just to ensure the session is active
    )

    # 将子组的 parent_id 设为 None
    from sqlalchemy import update
    await db.execute(
        update(AuthGroup)
        .where(AuthGroup.parent_id == id, AuthGroup.kb_id == kb_id)
        .values(parent_id=None)
    )

    await db.execute(
        delete(AuthGroup).where(AuthGroup.id == id, AuthGroup.kb_id == kb_id)
    )
    await db.commit()
    logger.info(f"Deleted auth group: {id}, kb_id={kb_id}")
    return None
