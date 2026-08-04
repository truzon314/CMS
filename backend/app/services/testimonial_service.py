import uuid

from app.domain.repositories.testimonial_repository import TestimonialRepository
from app.models.testimonial import Testimonial
from app.schemas.testimonial import TestimonialCreate, TestimonialUpdate
from app.services.audit_service import AuditService
from app.shared.exceptions.exceptions import NotFoundError


class TestimonialService:
    def __init__(self, testimonials: TestimonialRepository, audit: AuditService):
        self.testimonials = testimonials
        self.audit = audit

    async def list(
        self, *, page: int, per_page: int, is_published: bool | None = None, featured_only: bool = False
    ) -> tuple[list[Testimonial], int]:
        return await self.testimonials.list(page=page, per_page=per_page, is_published=is_published, featured_only=featured_only)

    async def get(self, testimonial_id: uuid.UUID) -> Testimonial:
        testimonial = await self.testimonials.get_by_id(testimonial_id)
        if testimonial is None:
            raise NotFoundError("Testimonial not found.")
        return testimonial

    async def create(self, payload: TestimonialCreate, actor_id: uuid.UUID) -> Testimonial:
        testimonial = Testimonial(**payload.model_dump())
        testimonial = await self.testimonials.create(testimonial)
        await self.audit.log(actor_id, "testimonials.create", "testimonial", testimonial.id)
        return testimonial

    async def update(self, testimonial_id: uuid.UUID, payload: TestimonialUpdate, actor_id: uuid.UUID) -> Testimonial:
        testimonial = await self.get(testimonial_id)
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(testimonial, field, value)
        testimonial = await self.testimonials.update(testimonial)
        await self.audit.log(actor_id, "testimonials.update", "testimonial", testimonial.id, details=data)
        return testimonial

    async def delete(self, testimonial_id: uuid.UUID, actor_id: uuid.UUID) -> None:
        testimonial = await self.get(testimonial_id)
        await self.testimonials.delete(testimonial)
        await self.audit.log(actor_id, "testimonials.delete", "testimonial", testimonial_id)
