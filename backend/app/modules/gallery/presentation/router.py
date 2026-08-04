import math
import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.models.user import User
from app.schemas.gallery import GalleryItemCreate, GalleryItemRead, GalleryItemUpdate
from app.services.gallery_service import GalleryService
from app.shared.dependencies.container import get_gallery_service
from app.shared.utils.common import PaginationMeta, ok

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.get("")
async def list_gallery_items(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    gallery: GalleryService = Depends(get_gallery_service),
    _=Depends(require_permission("gallery.view")),
):
    items, total = await gallery.list(page=page, per_page=per_page)
    data = [GalleryItemRead.model_validate(i).model_dump(mode="json") for i in items]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.post("")
async def create_gallery_item(
    payload: GalleryItemCreate,
    gallery: GalleryService = Depends(get_gallery_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("gallery.manage")),
):
    item = await gallery.create(payload, user.id)
    return ok(GalleryItemRead.model_validate(item).model_dump(mode="json"))


@router.put("/{item_id}")
async def update_gallery_item(
    item_id: uuid.UUID,
    payload: GalleryItemUpdate,
    gallery: GalleryService = Depends(get_gallery_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("gallery.manage")),
):
    item = await gallery.update(item_id, payload, user.id)
    return ok(GalleryItemRead.model_validate(item).model_dump(mode="json"))


@router.delete("/{item_id}")
async def delete_gallery_item(
    item_id: uuid.UUID,
    gallery: GalleryService = Depends(get_gallery_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("gallery.manage")),
):
    await gallery.delete(item_id, user.id)
    return ok(None)
