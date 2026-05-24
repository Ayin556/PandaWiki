"""前台公共接口 API"""

from fastapi import APIRouter, UploadFile, File
from app.api.deps import DbSession
from app.services.file import FileService

router = APIRouter()


@router.post("/file/upload")
async def file_upload(kb_id: str, file: UploadFile = File(...), db: DbSession = None):
    """前台上传图片 - 对应 Go 版 ShareCommonHandler.FileUpload"""
    service = FileService(db)
    url = await service.upload_file(kb_id, file)
    return {"url": url}


@router.post("/file/upload/url")
async def file_upload_by_url(kb_id: str, file_url: str, db: DbSession = None):
    """前台URL上传 - 对应 Go 版 ShareCommonHandler.FileUploadByUrl"""
    service = FileService(db)
    url = await service.upload_file_by_url(kb_id, file_url)
    return {"url": url}
