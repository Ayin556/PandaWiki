"""前台公共接口 API"""

from fastapi import APIRouter, UploadFile, File
from app.api.deps import DbSession, KbId
from app.core.captcha import captcha
from app.core.exceptions import BadRequestException
from app.services.file import FileService

router = APIRouter()


@router.post("/file/upload")
async def file_upload(kb_id: KbId, captcha_token: str = "", file: UploadFile = File(...), db: DbSession = None):
    """前台上传图片 - 对应 Go 版 ShareCommonHandler.FileUpload"""
    # 验证 captcha_token
    if not captcha.validate_token(captcha_token):
        raise BadRequestException("failed to validate captcha")
    service = FileService(db)
    url = await service.upload_file(kb_id, file)
    return {"url": url}


@router.post("/file/upload/url")
async def file_upload_by_url(req: dict, kb_id: KbId, db: DbSession = None):
    """前台URL上传 - 对应 Go 版 ShareCommonHandler.FileUploadByUrl"""
    # 验证 captcha_token
    captcha_token = req.get("captcha_token", "")
    if not captcha.validate_token(captcha_token):
        raise BadRequestException("failed to validate captcha")
    service = FileService(db)
    url = await service.upload_file_by_url(kb_id, req.get("url", ""))
    return {"url": url}
