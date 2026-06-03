"""License 管理 API - 解锁所有功能，返回商业版"""

from fastapi import APIRouter

from app.api.deps import CurrentUser

router = APIRouter()


@router.get("")
async def get_license(user: CurrentUser):
    """获取 License 信息 - 开源版返回 Free 版默认值"""
    return {
        "edition": 3,  # LicenseEditionBusiness - 解锁所有功能
        "expired_at": 0,
        "started_at": 0,
        "state": 0,
    }


@router.post("")
async def upload_license(user: CurrentUser):
    """上传 License - 保持商业版"""
    return {
        "edition": 3,
        "expired_at": 0,
        "started_at": 0,
        "state": 0,
    }


@router.delete("")
async def delete_license(user: CurrentUser):
    """解绑 License - 开源版不支持"""
    return {"message": "License deleted"}
