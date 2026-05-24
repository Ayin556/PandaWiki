"""知识库管理 API - 对应 Go 版 handler/v1/knowledge_base.go"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, AdminUser, DbSession
from app.schemas.knowledge_base import (
    KnowledgeBaseCreateRequest, KnowledgeBaseUpdateRequest,
    KnowledgeBaseDetailResponse, KnowledgeBaseListResponse,
    KBUserListResponse, KBUserInviteRequest, KBUserUpdateRequest,
    KBReleaseCreateRequest, KBReleaseListResponse,
)
from app.services.knowledge_base import KnowledgeBaseService

router = APIRouter()


@router.post("", response_model=KnowledgeBaseDetailResponse)
async def create_knowledge_base(
    req: KnowledgeBaseCreateRequest,
    user: CurrentUser,
    db: DbSession,
):
    """创建知识库 - 对应 Go 版 KnowledgeBaseHandler.CreateKnowledgeBase"""
    service = KnowledgeBaseService(db)
    kb = await service.create_knowledge_base(req, user.id if user else "")
    return KnowledgeBaseDetailResponse.from_orm(kb)


@router.get("/list")
async def get_knowledge_base_list(user: CurrentUser, db: DbSession):
    """获取知识库列表 - 对应 Go 版 KnowledgeBaseHandler.GetKnowledgeBaseList，直接返回数组"""
    service = KnowledgeBaseService(db)
    return await service.get_knowledge_base_list(user.id if user else "")


@router.get("/detail", response_model=KnowledgeBaseDetailResponse)
async def get_knowledge_base_detail(id: str, user: CurrentUser, db: DbSession):
    """获取知识库详情 - 对应 Go 版 KnowledgeBaseHandler.GetKnowledgeBaseDetail"""
    service = KnowledgeBaseService(db)
    kb = await service.get_knowledge_base(id)
    if not kb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return KnowledgeBaseDetailResponse.from_orm(kb)


@router.put("/detail")
async def update_knowledge_base(
    req: KnowledgeBaseUpdateRequest,
    user: CurrentUser,
    db: DbSession,
):
    """更新知识库 - 对应 Go 版 KnowledgeBaseHandler.UpdateKnowledgeBase"""
    service = KnowledgeBaseService(db)
    await service.update_knowledge_base(req)
    return {"message": "Updated successfully"}


@router.delete("/detail")
async def delete_knowledge_base(id: str, admin: AdminUser, db: DbSession):
    """删除知识库 - 对应 Go 版 KnowledgeBaseHandler.DeleteKnowledgeBase"""
    service = KnowledgeBaseService(db)
    await service.delete_knowledge_base(id)
    return {"message": "Deleted successfully"}


@router.get("/user/list", response_model=KBUserListResponse)
async def get_kb_users(kb_id: str, user: CurrentUser, db: DbSession):
    """获取知识库用户列表 - 对应 Go 版 KnowledgeBaseHandler.KBUserList"""
    service = KnowledgeBaseService(db)
    users = await service.get_kb_users(kb_id)
    return KBUserListResponse(list=users)


@router.post("/user/invite")
async def invite_kb_user(req: KBUserInviteRequest, user: CurrentUser, db: DbSession):
    """邀请用户加入知识库 - 对应 Go 版 KnowledgeBaseHandler.KBUserInvite"""
    service = KnowledgeBaseService(db)
    await service.invite_kb_user(req)
    return {"message": "User invited successfully"}


@router.patch("/user/update")
async def update_kb_user(req: KBUserUpdateRequest, user: CurrentUser, db: DbSession):
    """更新知识库用户权限 - 对应 Go 版 KnowledgeBaseHandler.KBUserUpdate"""
    service = KnowledgeBaseService(db)
    await service.update_kb_user(req)
    return {"message": "Updated successfully"}


@router.delete("/user/delete")
async def delete_kb_user(kb_id: str, user_id: str, user: CurrentUser, db: DbSession):
    """移除知识库用户 - 对应 Go 版 KnowledgeBaseHandler.KBUserDelete"""
    service = KnowledgeBaseService(db)
    await service.delete_kb_user(kb_id, user_id)
    return {"message": "User removed successfully"}


@router.post("/release")
async def create_kb_release(req: KBReleaseCreateRequest, user: CurrentUser, db: DbSession):
    """创建知识库发布版本 - 对应 Go 版 KnowledgeBaseHandler.CreateKBRelease"""
    service = KnowledgeBaseService(db)
    release_id = await service.create_kb_release(req, user.id if user else "")
    return {"id": release_id}


@router.get("/release/list", response_model=KBReleaseListResponse)
async def get_kb_release_list(kb_id: str, offset: int = 0, limit: int = 20, user: CurrentUser = None, db: DbSession = None):
    """获取发布版本列表 - 对应 Go 版 KnowledgeBaseHandler.GetKBReleaseList"""
    service = KnowledgeBaseService(db)
    releases = await service.get_kb_release_list(kb_id, offset, limit)
    return KBReleaseListResponse(list=releases)
