import uuid

from fastapi import APIRouter, Depends

from app.auth.rbac import require_any_permission, require_permission
from app.core.container import get_category_service, get_tag_service
from app.schemas.common import ok
from app.schemas.taxonomy import CategoryCreate, CategoryRead, CategoryUpdate, TagCreate, TagRead, TagUpdate
from app.services.category_service import CategoryService
from app.services.tag_service import TagService

router = APIRouter(tags=["taxonomy"])


@router.get("/categories")
async def list_categories(
    applies_to: str | None = None,
    category_service: CategoryService = Depends(get_category_service),
    _=Depends(require_any_permission("blog.edit", "properties.edit")),
):
    categories = await category_service.list_all(applies_to)
    return ok([CategoryRead.model_validate(c).model_dump(mode="json") for c in categories])


@router.post("/categories")
async def create_category(
    payload: CategoryCreate,
    category_service: CategoryService = Depends(get_category_service),
    _=Depends(require_any_permission("blog.edit", "properties.edit")),
):
    category = await category_service.create(payload)
    return ok(CategoryRead.model_validate(category).model_dump(mode="json"))


@router.put("/categories/{category_id}")
async def update_category(
    category_id: uuid.UUID,
    payload: CategoryUpdate,
    category_service: CategoryService = Depends(get_category_service),
    _=Depends(require_any_permission("blog.edit", "properties.edit")),
):
    category = await category_service.update(category_id, payload)
    return ok(CategoryRead.model_validate(category).model_dump(mode="json"))


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: uuid.UUID,
    category_service: CategoryService = Depends(get_category_service),
    _=Depends(require_any_permission("blog.edit", "properties.edit")),
):
    await category_service.delete(category_id)
    return ok({"deleted": True})


@router.get("/tags")
async def list_tags(
    tag_service: TagService = Depends(get_tag_service),
    _=Depends(require_permission("blog.edit")),
):
    tags = await tag_service.list_all()
    return ok([TagRead.model_validate(t).model_dump(mode="json") for t in tags])


@router.post("/tags")
async def create_tag(
    payload: TagCreate,
    tag_service: TagService = Depends(get_tag_service),
    _=Depends(require_permission("blog.edit")),
):
    tag = await tag_service.create(payload)
    return ok(TagRead.model_validate(tag).model_dump(mode="json"))


@router.put("/tags/{tag_id}")
async def update_tag(
    tag_id: uuid.UUID,
    payload: TagUpdate,
    tag_service: TagService = Depends(get_tag_service),
    _=Depends(require_permission("blog.edit")),
):
    tag = await tag_service.update(tag_id, payload)
    return ok(TagRead.model_validate(tag).model_dump(mode="json"))


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: uuid.UUID,
    tag_service: TagService = Depends(get_tag_service),
    _=Depends(require_permission("blog.edit")),
):
    await tag_service.delete(tag_id)
    return ok({"deleted": True})
