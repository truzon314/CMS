
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.models.page import PageType
from app.models.user import User
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
from app.shared.dependencies.container import get_page_service
from app.shared.utils.common import ok

router = APIRouter(tags=["pages"])


def _parse_page_type(page_type: str) -> PageType:
    try:
        return PageType[page_type.upper()]
    except KeyError:
        for pt in PageType:
            if pt.value.upper() == page_type.upper():
                return pt
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid page_type '{page_type}'. Valid options: {[e.value for e in PageType]}",
        )


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
    page_type: str,
    page_service: PageService = Depends(get_page_service),
    _=Depends(require_permission("pages.view")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.get(pt)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.get("/pages/{page_type}/preview")
async def preview_page(
    page_type: str,
    page_service: PageService = Depends(get_page_service),
    _=Depends(require_permission("pages.view")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.get(pt)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.put("/pages/{page_type}")
async def update_page(
    page_type: str,
    payload: PageUpdate,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.update(pt, payload, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.post("/pages/{page_type}/publish")
async def publish_page(
    page_type: str,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.publish")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.publish(pt, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.post("/pages/{page_type}/unpublish")
async def unpublish_page(
    page_type: str,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.publish")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.unpublish(pt, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.post("/pages/{page_type}/schedule")
async def schedule_page(
    page_type: str,
    payload: ScheduleRequest,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.publish")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.schedule(pt, payload.scheduled_at, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.get("/pages/{page_type}/blocks")
async def list_blocks(
    page_type: str,
    page_service: PageService = Depends(get_page_service),
    _=Depends(require_permission("pages.view")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.get(pt)
    return ok(PageRead.model_validate(page).model_dump(mode="json")["blocks"])


@router.post("/pages/{page_type}/blocks")
async def add_block(
    page_type: str,
    payload: PageBlockCreate,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.add_block(pt, payload, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.put("/pages/{page_type}/blocks/reorder")
async def reorder_blocks(
    page_type: str,
    payload: BlocksReorderRequest,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.reorder_blocks(pt, payload.order, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.put("/pages/{page_type}/blocks/{block_id}")
async def update_block(
    page_type: str,
    block_id: str,
    payload: PageBlockUpdate,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.update_block(pt, block_id, payload, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.delete("/pages/{page_type}/blocks/{block_id}")
async def delete_block(
    page_type: str,
    block_id: str,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.delete_block(pt, block_id, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))


@router.get("/pages/{page_type}/versions")
async def list_versions(
    page_type: str,
    page_service: PageService = Depends(get_page_service),
    _=Depends(require_permission("pages.view")),
):
    pt = _parse_page_type(page_type)
    versions = await page_service.list_versions(pt)
    return ok([EntityVersionRead.model_validate(v).model_dump(mode="json") for v in versions])


@router.post("/pages/{page_type}/versions/{version_id}/restore")
async def restore_version(
    page_type: str,
    version_id: str,
    page_service: PageService = Depends(get_page_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    pt = _parse_page_type(page_type)
    page = await page_service.restore_version(pt, version_id, user.id)
    return ok(PageRead.model_validate(page).model_dump(mode="json"))
