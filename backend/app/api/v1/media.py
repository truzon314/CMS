import math
import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.core.container import get_media_service
from app.models.user import User
from app.schemas.common import PaginationMeta, ok
from app.schemas.media import (
    MediaFolderCreate,
    MediaFolderRead,
    MediaFolderUpdate,
    MediaRead,
    MediaUpdate,
    MediaUsageRead,
)
from app.services.media_service import MediaService

router = APIRouter(prefix="/media", tags=["media"])


@router.get("")
async def list_media(
    page: int = Query(1, ge=1),
    per_page: int = Query(40, ge=1, le=100),
    folder_id: uuid.UUID | None = None,
    mime_type: str | None = None,
    search: str | None = None,
    media_service: MediaService = Depends(get_media_service),
    _=Depends(require_permission("media.view")),
):
    items, total = await media_service.list_media(
        page=page, per_page=per_page, folder_id=folder_id, mime_type=mime_type, search=search
    )
    data = [MediaRead.model_validate(m).model_dump(mode="json") for m in items]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.post("")
async def upload_media(
    files: list[UploadFile] = File(...),
    folder_id: uuid.UUID | None = None,
    media_service: MediaService = Depends(get_media_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("media.manage")),
):
    payload = [(f.filename or "upload", await f.read()) for f in files]
    created = await media_service.upload(payload, folder_id, user.id)
    return ok([MediaRead.model_validate(m).model_dump(mode="json") for m in created])


@router.get("/folders")
async def list_folders(
    media_service: MediaService = Depends(get_media_service),
    _=Depends(require_permission("media.view")),
):
    folders = await media_service.list_folders()
    return ok([MediaFolderRead.model_validate(f).model_dump(mode="json") for f in folders])


@router.post("/folders")
async def create_folder(
    payload: MediaFolderCreate,
    media_service: MediaService = Depends(get_media_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("media.manage")),
):
    folder = await media_service.create_folder(payload, user.id)
    return ok(MediaFolderRead.model_validate(folder).model_dump(mode="json"))


@router.put("/folders/{folder_id}")
async def update_folder(
    folder_id: uuid.UUID,
    payload: MediaFolderUpdate,
    media_service: MediaService = Depends(get_media_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("media.manage")),
):
    folder = await media_service.update_folder(folder_id, payload, user.id)
    return ok(MediaFolderRead.model_validate(folder).model_dump(mode="json"))


@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: uuid.UUID,
    media_service: MediaService = Depends(get_media_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("media.manage")),
):
    await media_service.delete_folder(folder_id, user.id)
    return ok({"deleted": True})


@router.get("/{media_id}")
async def get_media(
    media_id: uuid.UUID,
    media_service: MediaService = Depends(get_media_service),
    _=Depends(require_permission("media.view")),
):
    media = await media_service.get(media_id)
    return ok(MediaRead.model_validate(media).model_dump(mode="json"))


@router.put("/{media_id}")
async def update_media(
    media_id: uuid.UUID,
    payload: MediaUpdate,
    media_service: MediaService = Depends(get_media_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("media.manage")),
):
    media = await media_service.update(media_id, payload, user.id)
    return ok(MediaRead.model_validate(media).model_dump(mode="json"))


@router.delete("/{media_id}")
async def delete_media(
    media_id: uuid.UUID,
    force: bool = False,
    media_service: MediaService = Depends(get_media_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("media.manage")),
):
    await media_service.delete(media_id, force, user.id)
    return ok({"deleted": True})


@router.post("/{media_id}/restore")
async def restore_media(
    media_id: uuid.UUID,
    media_service: MediaService = Depends(get_media_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("media.manage")),
):
    media = await media_service.restore(media_id, user.id)
    return ok(MediaRead.model_validate(media).model_dump(mode="json"))


@router.get("/{media_id}/usage")
async def get_media_usage(
    media_id: uuid.UUID,
    media_service: MediaService = Depends(get_media_service),
    _=Depends(require_permission("media.view")),
):
    usage = await media_service.get_usage(media_id)
    return ok([MediaUsageRead.model_validate(u).model_dump(mode="json") for u in usage])
