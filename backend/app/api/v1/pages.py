import uuid

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.core.container import get_page_service
from app.models.page import PageType
from app.models.user import User
from app.schemas.common import ok
from app.schemas.page import (
    BlocksReorderRequest,
    PageBlockCreate,
    PageBlockUpdate,
    PageListItem,
    PageRead,
    PageUpdate,
    ScheduleRequest,
)
from app.schemas.version import EntityVersionRead
from app.services.page_service import PageService

router = APIRouter(tags=["pages"])


@router.get("/pages")
async def list_pages(
    page_service: PageService = Depends(get_page_service),
    _=Depends(require_permission("pages.view")),
):
    pages = await page_service.list_pages()
    return ok([PageListItem.model_validate(p).model_dump(mode="json") for p in pages])


@router.get("/block-definitions")
async def list_block_definitions(
    page_service: PageService = Depends(get_page_service),
    _=Depends(require_permission("pages.view")),
):
    definitions = await page_service.list_block_definitions()
    return ok([d.model_dump(mode="json") for d in definitions])


@router.get("/pages/{page_type}")
async def get_page(
    page_type: PageType,
    page_service: PageService = Depends(get_page_service),
    _=Depends(require_permission("pages.view")),
):
    page = await page_service.get(page_type)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.get("/pages/{page_type}/preview")
async def preview_page(
    page_type: PageType,
    page_service: PageService = Depends(get_page_service),
    _=Depends(require_permission("pages.view")),
):
    page = await page_service.get(page_type)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.put("/pages/{page_type}")
async def update_page(
    page_type: PageType,
    payload: PageUpdate,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    page = await page_service.update(page_type, payload, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.post("/pages/{page_type}/publish")
async def publish_page(
    page_type: PageType,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.publish")),
):
    page = await page_service.publish(page_type, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.post("/pages/{page_type}/unpublish")
async def unpublish_page(
    page_type: PageType,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.publish")),
):
    page = await page_service.unpublish(page_type, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.post("/pages/{page_type}/schedule")
async def schedule_page(
    page_type: PageType,
    payload: ScheduleRequest,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.publish")),
):
    page = await page_service.schedule(page_type, payload.scheduled_at, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.get("/pages/{page_type}/blocks")
async def list_blocks(
    page_type: PageType,
    page_service: PageService = Depends(get_page_service),
    _=Depends(require_permission("pages.view")),
):
    page = await page_service.get(page_type)
    return ok(PageRead.model_validate(page).model_dump(mode="json")["blocks"])


@router.post("/pages/{page_type}/blocks")
async def add_block(
    page_type: PageType,
    payload: PageBlockCreate,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    page = await page_service.add_block(page_type, payload, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.put("/pages/{page_type}/blocks/reorder")
async def reorder_blocks(
    page_type: PageType,
    payload: BlocksReorderRequest,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    page = await page_service.reorder_blocks(page_type, payload.order, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.put("/pages/{page_type}/blocks/{block_id}")
async def update_block(
    page_type: PageType,
    block_id: uuid.UUID,
    payload: PageBlockUpdate,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    page = await page_service.update_block(page_type, block_id, payload, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.delete("/pages/{page_type}/blocks/{block_id}")
async def delete_block(
    page_type: PageType,
    block_id: uuid.UUID,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    page = await page_service.delete_block(page_type, block_id, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.get("/pages/{page_type}/versions")
async def list_versions(
    page_type: PageType,
    page_service: PageService = Depends(get_page_service),
    _=Depends(require_permission("pages.view")),
):
    versions = await page_service.list_versions(page_type)
    return ok([EntityVersionRead.model_validate(v).model_dump(mode="json") for v in versions])


@router.post("/pages/{page_type}/versions/{version_id}/restore")
async def restore_version(
    page_type: PageType,
    version_id: uuid.UUID,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    page = await page_service.restore_version(page_type, version_id, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))
