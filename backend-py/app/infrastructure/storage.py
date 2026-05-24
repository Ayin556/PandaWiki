"""MinIO/S3 对象存储"""

import io
from typing import Optional
from uuid import uuid4

from loguru import logger
from minio import Minio
from minio.error import S3Error

from app.core.config import settings


class MinioClient:
    """MinIO 客户端 - 对应 Go 版 store/s3/MinioClient"""

    def __init__(self):
        self.client = Minio(
            settings.S3_ENDPOINT,
            access_key=settings.S3_ACCESS_KEY,
            secret_key=settings.S3_SECRET_KEY,
            secure=settings.S3_USE_SSL,
        )
        self._ensure_bucket()

    def _ensure_bucket(self):
        """确保 bucket 存在"""
        try:
            if not self.client.bucket_exists(settings.S3_BUCKET):
                self.client.make_bucket(settings.S3_BUCKET)
                logger.info(f"Created bucket: {settings.S3_BUCKET}")
        except S3Error as e:
            logger.error(f"MinIO bucket error: {e}")

    def upload_file(
        self,
        object_name: str,
        data: bytes | io.IOBase,
        content_type: str = "application/octet-stream",
        length: Optional[int] = None,
    ) -> str:
        """上传文件到 S3"""
        if isinstance(data, bytes):
            data_stream = io.BytesIO(data)
            length = length or len(data)
        else:
            data_stream = data

        self.client.put_object(
            settings.S3_BUCKET,
            object_name,
            data_stream,
            length=length or -1,
            content_type=content_type,
        )
        return f"http://{settings.S3_ENDPOINT}/{settings.S3_BUCKET}/{object_name}"

    def sign_url(self, object_name: str, expires: int = 3600) -> str:
        """生成预签名 URL"""
        from datetime import timedelta
        return self.client.presigned_get_object(
            settings.S3_BUCKET,
            object_name,
            expires=timedelta(seconds=expires),
        )

    def delete_file(self, object_name: str) -> None:
        """删除文件"""
        self.client.remove_object(settings.S3_BUCKET, object_name)


def get_minio_client() -> MinioClient:
    """获取 MinIO 客户端单例"""
    return MinioClient()
