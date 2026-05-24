"""文件服务 - 对应 Go 版 usecase/file.go"""

import uuid

import httpx
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession


class FileService:
    """文件上传业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload_file(self, kb_id: str, file) -> str:
        """上传文件到S3 - 对应 Go 版 UploadFile"""
        from app.infrastructure.storage import get_minio_client

        client = get_minio_client()
        ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else ""
        object_name = f"{kb_id}/{uuid.uuid4()}.{ext}"
        content = await file.read()
        url = client.upload_file(object_name, content, file.content_type)
        return url

    async def upload_file_by_url(self, kb_id: str, file_url: str) -> str:
        """通过URL上传文件 - 对应 Go 版 UploadFileByURL"""
        from app.infrastructure.storage import get_minio_client

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.get(file_url)
                response.raise_for_status()

            content_type = response.headers.get("content-type", "application/octet-stream")
            content = response.content

            # 从 URL 推断扩展名
            ext = ""
            if "." in file_url.split("/")[-1]:
                ext = file_url.split("/")[-1].rsplit(".", 1)[-1].split("?")[0]
            object_name = f"{kb_id}/{uuid.uuid4()}.{ext}" if ext else f"{kb_id}/{uuid.uuid4()}"

            minio_client = get_minio_client()
            url = minio_client.upload_file(object_name, content, content_type)
            return url
        except Exception as e:
            logger.error(f"Upload file by URL failed: {e}")
            raise

    async def upload_anydoc(self, file, path: str) -> str:
        """Anydoc文件上传 - 对应 Go 版 UploadAnydoc"""
        # Anydoc 集成为 P3 功能，暂时使用普通上传
        from app.infrastructure.storage import get_minio_client

        client = get_minio_client()
        ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else ""
        object_name = f"anydoc/{path}/{uuid.uuid4()}.{ext}"
        content = await file.read()
        url = client.upload_file(object_name, content, file.content_type)
        return url
