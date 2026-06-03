"""文档历史版本 API - 对应 Go 版 Pro /api/pro/v1/node/release/*"""

from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.models.node import NodeRelease, Node
from app.models.user import User

router = APIRouter()


@router.get("/release/list")
async def list_node_releases(
    user: CurrentUser,
    db: DbSession,
    kb_id: str = Query(..., description="知识库ID"),
    node_id: str = Query(..., description="文档节点ID"),
):
    """获取文档历史版本列表"""
    result = await db.execute(
        select(NodeRelease)
        .where(NodeRelease.kb_id == kb_id, NodeRelease.node_id == node_id)
        .order_by(NodeRelease.updated_at.desc())
    )
    releases = result.scalars().all()

    # 批量查询用户信息
    all_user_ids = set()
    for r in releases:
        if r.publisher_id:
            all_user_ids.add(r.publisher_id)
        if r.editor_id:
            all_user_ids.add(r.editor_id)

    user_map = {}
    if all_user_ids:
        users_result = await db.execute(
            select(User).where(User.id.in_(all_user_ids))
        )
        for u in users_result.scalars().all():
            user_map[u.id] = u.account

    data = []
    for r in releases:
        meta = r.meta or {}
        data.append({
            "id": r.id,
            "node_id": r.node_id,
            "release_id": r.doc_id or "",
            "release_name": r.name or "",
            "release_message": "",
            "name": r.name or "",
            "meta": {
                "content_type": meta.get("content_type", ""),
                "emoji": meta.get("emoji", ""),
                "summary": meta.get("summary", ""),
            },
            "creator_account": user_map.get(r.editor_id, ""),
            "creator_id": r.editor_id or "",
            "editor_account": user_map.get(r.editor_id, ""),
            "editor_id": r.editor_id or "",
            "publisher_account": user_map.get(r.publisher_id, ""),
            "publisher_id": r.publisher_id or "",
            "updated_at": r.updated_at.isoformat() if r.updated_at else "",
        })

    return {"list": data}


@router.get("/release/detail")
async def get_node_release_detail(
    user: CurrentUser,
    db: DbSession,
    id: str = Query(..., description="版本ID"),
    kb_id: str = Query(..., description="知识库ID"),
):
    """获取版本详情"""
    from fastapi import HTTPException

    result = await db.execute(
        select(NodeRelease).where(NodeRelease.id == id, NodeRelease.kb_id == kb_id)
    )
    release = result.scalar_one_or_none()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found")

    meta = release.meta or {}

    # 查询用户信息
    user_ids = set()
    if release.publisher_id:
        user_ids.add(release.publisher_id)
    if release.editor_id:
        user_ids.add(release.editor_id)

    user_map = {}
    if user_ids:
        users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        for u in users_result.scalars().all():
            user_map[u.id] = u.account

    return {
        "content": release.content or "",
        "name": release.name or "",
        "node_id": release.node_id,
        "meta": {
            "content_type": meta.get("content_type", ""),
            "emoji": meta.get("emoji", ""),
            "summary": meta.get("summary", ""),
        },
        "creator_account": user_map.get(release.editor_id, ""),
        "creator_id": release.editor_id or "",
        "editor_account": user_map.get(release.editor_id, ""),
        "editor_id": release.editor_id or "",
        "publisher_account": user_map.get(release.publisher_id, ""),
        "publisher_id": release.publisher_id or "",
    }
