import asyncio
import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from google.api_core.exceptions import NotFound
from google.cloud import storage

from app.shared.config.config import get_settings

router = APIRouter(tags=["media-files"])


_SAFE_KEY_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
    r"\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|pdf|doc|docx|xls|xlsx|zip)$",
    re.IGNORECASE,
)


_CONTENT_TYPE_BY_EXTENSION = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".zip": "application/zip",
}


# Reuse the GCS client and bucket for the lifetime of the Cloud Run process.
# Creating a new client for every request adds unnecessary overhead.
_gcs_client: storage.Client | None = None
_gcs_bucket: storage.Bucket | None = None
_gcs_bucket_name: str | None = None


def _get_gcs_bucket():
    global _gcs_client
    global _gcs_bucket
    global _gcs_bucket_name

    settings = get_settings()

    if not settings.gcs_bucket:
        raise RuntimeError("GCS bucket is not configured.")

    # Reuse the existing client/bucket on warm Cloud Run instances.
    if _gcs_bucket is None or _gcs_bucket_name != settings.gcs_bucket:
        _gcs_client = storage.Client(project=settings.gcp_project_id)
        _gcs_bucket = _gcs_client.bucket(settings.gcs_bucket)
        _gcs_bucket_name = settings.gcs_bucket

    return _gcs_bucket


@router.get("/media-files/{key}")
async def get_media_file(key: str):
    if not _SAFE_KEY_RE.fullmatch(key):
        raise HTTPException(status_code=404, detail="Not found.")

    settings = get_settings()

    # ------------------------------------------------------------------
    # Google Cloud Storage
    # ------------------------------------------------------------------
    if settings.storage_backend == "gcs":
        try:
            bucket = _get_gcs_bucket()
            blob = bucket.blob(key)

            # Do not call blob.exists() first.
            # download_as_bytes() already tells us whether the object exists.
            content = await asyncio.to_thread(
                blob.download_as_bytes,
            )

        except NotFound:
            raise HTTPException(
                status_code=404,
                detail="Not found.",
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Unable to retrieve media file: {exc}",
            ) from exc

    # ------------------------------------------------------------------
    # Local storage fallback
    # ------------------------------------------------------------------
    else:
        from pathlib import Path

        path = Path(settings.media_storage_dir) / key

        if not path.is_file():
            raise HTTPException(
                status_code=404,
                detail="Not found.",
            )

        try:
            content = await asyncio.to_thread(
                path.read_bytes,
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Unable to retrieve media file: {exc}",
            ) from exc

    # ------------------------------------------------------------------
    # Response metadata
    # ------------------------------------------------------------------
    ext = "." + key.rsplit(".", 1)[-1].lower()

    content_type = _CONTENT_TYPE_BY_EXTENSION.get(
        ext,
        "application/octet-stream",
    )

    headers = {
        # Media files use UUID-style filenames, so they are effectively
        # immutable references. Cache for one day and allow stale content
        # while the browser revalidates.
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    }

    if content_type == "image/svg+xml":
        headers["Content-Disposition"] = "attachment"

    return Response(
        content=content,
        media_type=content_type,
        headers=headers,
    )