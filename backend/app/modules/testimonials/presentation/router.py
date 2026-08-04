import math
import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.models.user import User
from app.schemas.testimonial import TestimonialCreate, TestimonialRead, TestimonialUpdate
from app.services.testimonial_service import TestimonialService
from app.shared.dependencies.container import get_testimonial_service
from app.shared.utils.common import PaginationMeta, ok

router = APIRouter(prefix="/testimonials", tags=["testimonials"])


@router.get("")
async def list_testimonials(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    testimonials: TestimonialService = Depends(get_testimonial_service),
    _=Depends(require_permission("testimonials.view")),
):
    items, total = await testimonials.list(page=page, per_page=per_page)
    data = [TestimonialRead.model_validate(t).model_dump(mode="json") for t in items]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.post("")
async def create_testimonial(
    payload: TestimonialCreate,
    testimonials: TestimonialService = Depends(get_testimonial_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("testimonials.manage")),
):
    testimonial = await testimonials.create(payload, user.id)
    return ok(TestimonialRead.model_validate(testimonial).model_dump(mode="json"))


@router.put("/{testimonial_id}")
async def update_testimonial(
    testimonial_id: uuid.UUID,
    payload: TestimonialUpdate,
    testimonials: TestimonialService = Depends(get_testimonial_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("testimonials.manage")),
):
    testimonial = await testimonials.update(testimonial_id, payload, user.id)
    return ok(TestimonialRead.model_validate(testimonial).model_dump(mode="json"))


@router.delete("/{testimonial_id}")
async def delete_testimonial(
    testimonial_id: uuid.UUID,
    testimonials: TestimonialService = Depends(get_testimonial_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("testimonials.manage")),
):
    await testimonials.delete(testimonial_id, user.id)
    return ok(None)
