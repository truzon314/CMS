import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.models.user import User
from app.services.trash_service import TrashService
from app.shared.dependencies.container import get_trash_service
from app.shared.utils.common import PaginationMeta, ok

router = APIRouter(prefix="/trash", tags=["trash"])


@router.get("")
async def list_trash(
    entity_type: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    trash_service: TrashService = Depends(get_trash_service),
    _=Depends(require_permission("trash.manage")),
):
    items, total = await trash_service.list_trash(entity_type=entity_type, page=page, per_page=per_page)
    data = [
        {
            "entity_type": i.entity_type,
            "id": str(i.id),
            "title": i.title,
            "deleted_at": i.deleted_at.isoformat(),
        }
        for i in items
    ]
    total_pages = max(1, (total + per_page - 1) // per_page)
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=total_pages)
    return ok(data, meta)


@router.post("/{entity_type}/{entity_id}/restore")
async def restore_trash_item(
    entity_type: str,
    entity_id: uuid.UUID,
    trash_service: TrashService = Depends(get_trash_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("trash.manage")),
):
    await trash_service.restore(entity_type, entity_id, user.id)
    return ok({"restored": True})
