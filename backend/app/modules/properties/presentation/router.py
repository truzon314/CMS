import math
import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.models.user import User
from app.schemas.property import (
    PropertiesReorderRequest,
    PropertyCreate,
    PropertyGalleryRequest,
    PropertyListItem,
    PropertyRead,
    PropertyUpdate,
)
from app.services.property_service import PropertyService
from app.shared.dependencies.container import get_property_service
from app.shared.utils.common import PaginationMeta, ok

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("")
async def list_properties(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str | None = None,
    city: str | None = None,
    type: uuid.UUID | None = None,
    budget_bracket: str | None = None,
    search: str | None = None,
    property_service: PropertyService = Depends(get_property_service),
    _=Depends(require_permission("properties.view")),
):
    properties, total = await property_service.list_properties(
        page=page, per_page=per_page, status=status, city=city, category_id=type,
        budget_bracket=budget_bracket, search=search,
    )
    data = [
        PropertyListItem(
            id=p.id,
            name=p.name,
            slug=p.slug,
            city=p.city,
            category_names=[c.name for c in p.categories],
            price_display=p.price_display,
            status=p.status,
            sort_order=p.sort_order,
            updated_at=p.updated_at,
        ).model_dump(mode="json")
        for p in properties
    ]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.put("/reorder")
async def reorder_properties(
    payload: PropertiesReorderRequest,
    property_service: PropertyService = Depends(get_property_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("properties.edit")),
):
    await property_service.reorder(payload.order, user.id)
    return ok({"reordered": True})


@router.post("")
async def create_property(
    payload: PropertyCreate,
    property_service: PropertyService = Depends(get_property_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("properties.create")),
):
    property_ = await property_service.create(payload, user.id)
    return ok(PropertyRead.model_validate(property_).model_dump(mode="json"))


@router.get("/{property_id}")
async def get_property(
    property_id: uuid.UUID,
    property_service: PropertyService = Depends(get_property_service),
    _=Depends(require_permission("properties.view")),
):
    property_ = await property_service.get(property_id)
    return ok(PropertyRead.model_validate(property_).model_dump(mode="json"))


@router.put("/{property_id}")
async def update_property(
    property_id: uuid.UUID,
    payload: PropertyUpdate,
    property_service: PropertyService = Depends(get_property_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("properties.edit")),
):
    property_ = await property_service.update(property_id, payload, user.id)
    return ok(PropertyRead.model_validate(property_).model_dump(mode="json"))


@router.delete("/{property_id}")
async def delete_property(
    property_id: uuid.UUID,
    property_service: PropertyService = Depends(get_property_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("properties.delete")),
):
    await property_service.soft_delete(property_id, user.id)
    return ok({"deleted": True})


@router.post("/{property_id}/restore")
async def restore_property(
    property_id: uuid.UUID,
    property_service: PropertyService = Depends(get_property_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("properties.delete")),
):
    property_ = await property_service.restore(property_id, user.id)
    return ok(PropertyRead.model_validate(property_).model_dump(mode="json"))


@router.post("/{property_id}/duplicate")
async def duplicate_property(
    property_id: uuid.UUID,
    property_service: PropertyService = Depends(get_property_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("properties.create")),
):
    property_ = await property_service.duplicate(property_id, user.id)
    return ok(PropertyRead.model_validate(property_).model_dump(mode="json"))


@router.put("/{property_id}/gallery")
async def set_property_gallery(
    property_id: uuid.UUID,
    payload: PropertyGalleryRequest,
    property_service: PropertyService = Depends(get_property_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("properties.edit")),
):
    property_ = await property_service.set_gallery(property_id, payload, user.id)
    return ok(PropertyRead.model_validate(property_).model_dump(mode="json"))


@router.post("/{property_id}/publish")
async def publish_property(
    property_id: uuid.UUID,
    property_service: PropertyService = Depends(get_property_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("properties.publish")),
):
    property_ = await property_service.publish(property_id, user.id)
    return ok(PropertyRead.model_validate(property_).model_dump(mode="json"))


@router.post("/{property_id}/unpublish")
async def unpublish_property(
    property_id: uuid.UUID,
    property_service: PropertyService = Depends(get_property_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("properties.publish")),
):
    property_ = await property_service.unpublish(property_id, user.id)
    return ok(PropertyRead.model_validate(property_).model_dump(mode="json"))
