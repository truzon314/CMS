import math
import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.core.container import get_user_service
from app.models.user import User
from app.schemas.common import PaginationMeta, ok
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    user_service: UserService = Depends(get_user_service),
    _=Depends(require_permission("users.view")),
):
    users, total = await user_service.list(page=page, per_page=per_page, search=search)
    data = [UserRead.model_validate(u).model_dump(mode="json") for u in users]
    meta = PaginationMeta(
        page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page))
    )
    return ok(data, meta)


@router.post("")
async def create_user(
    payload: UserCreate,
    user_service: UserService = Depends(get_user_service),
    actor: User = Depends(get_current_user),
    _=Depends(require_permission("users.manage")),
):
    user = await user_service.create(payload, actor.id)
    return ok(UserRead.model_validate(user).model_dump(mode="json"))


@router.get("/{user_id}")
async def get_user(
    user_id: uuid.UUID,
    user_service: UserService = Depends(get_user_service),
    _=Depends(require_permission("users.view")),
):
    user = await user_service.get(user_id)
    return ok(UserRead.model_validate(user).model_dump(mode="json"))


@router.put("/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    user_service: UserService = Depends(get_user_service),
    actor: User = Depends(get_current_user),
    _=Depends(require_permission("users.manage")),
):
    user = await user_service.update(user_id, payload, actor.id)
    return ok(UserRead.model_validate(user).model_dump(mode="json"))


@router.delete("/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    user_service: UserService = Depends(get_user_service),
    actor: User = Depends(get_current_user),
    _=Depends(require_permission("users.manage")),
):
    await user_service.soft_delete(user_id, actor.id)
    return ok({"deleted": True})


@router.post("/{user_id}/restore")
async def restore_user(
    user_id: uuid.UUID,
    user_service: UserService = Depends(get_user_service),
    actor: User = Depends(get_current_user),
    _=Depends(require_permission("users.manage")),
):
    user = await user_service.restore(user_id, actor.id)
    return ok(UserRead.model_validate(user).model_dump(mode="json"))
