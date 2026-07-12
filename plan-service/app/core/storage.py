"""MinIO client for S3-compatible file storage."""

from io import BytesIO

from minio import Minio
from minio.error import S3Error

from app.core.config import settings


class StorageService:
    """Handles file upload/download to MinIO (S3-compatible)."""

    def __init__(self) -> None:
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self.bucket = settings.minio_bucket

    def ensure_bucket(self) -> None:
        """Create the bucket if it doesn't exist."""
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    def upload_file(self, object_key: str, data: bytes, content_type: str) -> str:
        """Upload a file to MinIO. Returns the object key."""
        stream = BytesIO(data)
        self.client.put_object(
            self.bucket,
            object_key,
            stream,
            length=len(data),
            content_type=content_type,
        )
        return object_key

    def download_file(self, object_key: str) -> bytes:
        """Download a file from MinIO. Returns file content as bytes."""
        response = self.client.get_object(self.bucket, object_key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def delete_file(self, object_key: str) -> None:
        """Delete a file from MinIO."""
        self.client.remove_object(self.bucket, object_key)

    def file_exists(self, object_key: str) -> bool:
        """Check if a file exists in MinIO."""
        try:
            self.client.stat_object(self.bucket, object_key)
            return True
        except S3Error:
            return False


# Singleton instance
storage = StorageService()
