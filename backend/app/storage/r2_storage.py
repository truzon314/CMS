import asyncio

import boto3

from app.core.config import get_settings


class R2StorageAdapter:
    """Cloudflare R2 (S3-compatible) implementation of `StorageAdapter`, used in
    prod once `R2_*` env vars are set (ARCHITECTURE.md) — `get_storage_adapter()`
    in `core/container.py` only wires this in when `settings.r2_configured`."""

    def __init__(self) -> None:
        settings = get_settings()
        self._bucket = settings.r2_bucket
        self._base_url = (settings.r2_public_base_url or "").rstrip("/")
        self._client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
        )

    async def save(self, key: str, content: bytes, content_type: str) -> str:
        await asyncio.to_thread(
            self._client.put_object,
            Bucket=self._bucket,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        return f"{self._base_url}/{key}"

    async def delete(self, key: str) -> None:
        await asyncio.to_thread(self._client.delete_object, Bucket=self._bucket, Key=key)
