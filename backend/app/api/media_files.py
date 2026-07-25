"""Serves locally-stored media (`LocalStorageAdapter`, dev/tests only — R2 URLs
in prod point straight at the bucket, bypassing this route entirely). Public,
unauthenticated: real asset URLs (R2/CDN) aren't JWT-gated either, and `<img
src>` tags can't attach an Authorization header.
"""

import re
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.core.config import get_settings

router = APIRouter(tags=["media-files"])

_SAFE_KEY_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
    r"\.(jpg|png|gif|webp|svg|mp4|webm|mov|pdf|doc|docx|xls|xlsx|zip)$",
    re.IGNORECASE,
)

_CONTENT_TYPE_BY_EXTENSION = {
    ".jpg": "image/jpeg",
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


@router.get("/media-files/{key}")
async def get_media_file(key: str):
    # No path separators allowed — `file_key` is always a flat UUID+extension,
    # so anything else is a directory-traversal attempt, not a real asset.
    if not _SAFE_KEY_RE.match(key):
        raise HTTPException(status_code=404, detail="Not found.")

    settings = get_settings()
    path = Path(settings.media_storage_dir) / key
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Not found.")

    ext = path.suffix.lower()
    content_type = _CONTENT_TYPE_BY_EXTENSION.get(ext, "application/octet-stream")
    headers = {}
    if content_type == "image/svg+xml":
        # SECURITY_CHECKLIST.md §6 — force download instead of inline render on
        # direct navigation; `<img src>` embedding elsewhere is unaffected.
        headers["Content-Disposition"] = "attachment"

    return FileResponse(path, media_type=content_type, headers=headers)
