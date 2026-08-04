import math
import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.models.user import User
from app.schemas.career import CareerCreate, CareerRead, CareerUpdate
from app.services.career_service import CareerService
from app.shared.dependencies.container import get_career_service
from app.shared.utils.common import PaginationMeta, ok

router = APIRouter(prefix="/careers", tags=["careers"])


@router.get("")
async def list_careers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    careers: CareerService = Depends(get_career_service),
    _=Depends(require_permission("careers.view")),
):
    items, total = await careers.list(page=page, per_page=per_page)
    data = [CareerRead.model_validate(c).model_dump(mode="json") for c in items]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.post("")
async def create_career(
    payload: CareerCreate,
    careers: CareerService = Depends(get_career_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("careers.manage")),
):
    career = await careers.create(payload, user.id)
    return ok(CareerRead.model_validate(career).model_dump(mode="json"))


@router.put("/{career_id}")
async def update_career(
    career_id: uuid.UUID,
    payload: CareerUpdate,
    careers: CareerService = Depends(get_career_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("careers.manage")),
):
    career = await careers.update(career_id, payload, user.id)
    return ok(CareerRead.model_validate(career).model_dump(mode="json"))


@router.delete("/{career_id}")
async def delete_career(
    career_id: uuid.UUID,
    careers: CareerService = Depends(get_career_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("careers.manage")),
):
    await careers.delete(career_id, user.id)
    return ok(None)
