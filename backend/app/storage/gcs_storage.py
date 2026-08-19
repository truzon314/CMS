import asyncio

from google.cloud import storage

from app.shared.config.config import get_settings


class GCSStorageAdapter:
    """Google Cloud Storage implementation of StorageAdapter."""

    def __init__(self) -> None:
        settings = get_settings()

        self._bucket_name = settings.gcs_bucket

        if not self._bucket_name:
            raise RuntimeError("GCS_BUCKET is not configured.")

        self._client = storage.Client(project=settings.gcp_project_id)
        self._bucket = self._client.bucket(self._bucket_name)
        self._base_url = settings.public_media_base_url.rstrip("/")

    async def save(self, key: str, content: bytes, content_type: str) -> str:
        blob = self._bucket.blob(key)

        await asyncio.to_thread(
            blob.upload_from_string,
            content,
            content_type=content_type,
        )

        return f"{self._base_url}/media-files/{key}"

    async def delete(self, key: str) -> None:
        blob = self._bucket.blob(key)

        await asyncio.to_thread(
            blob.delete,
        )