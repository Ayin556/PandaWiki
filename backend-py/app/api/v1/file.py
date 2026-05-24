"""文件上传 API - 对应 Go 版 handler/v1/file.go"""

from fastapi import APIRouter, UploadFile, File
from app.api.deps import CurrentUser, DbSession
from app.services.file import FileService

router = APIRouter()


@router.post("/upload")
async def upload_file(kb_id: str, file: UploadFile = File(...), user: CurrentUser = None, db: DbSession = None):
    """上传文件 - 对应 Go 版 FileHandler.Upload"""
    service = FileService(db)
    url = await service.upload_file(kb_id, file)
    return {"url": url}


@router.post("/upload/url")
async def upload_file_by_url(kb_id: str, file_url: str, user: CurrentUser = None, db: DbSession = None):
    """通过URL上传文件 - 对应 Go 版 FileHandler.UploadByUrl"""
    service = FileService(db)
    url = await service.upload_file_by_url(kb_id, file_url)
    return {"url": url}


@router.post("/upload/anydoc")
async def upload_anydoc(file: UploadFile = File(...), path: str = "", db: DbSession = None):
    """Anydoc文件上传 - 对应 Go 版 FileHandler.UploadAnydoc"""
    service = FileService(db)
    url = await service.upload_anydoc(file, path)
    return {"url": url}
