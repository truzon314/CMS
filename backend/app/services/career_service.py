import uuid

from app.domain.repositories.career_repository import CareerRepository
from app.models.career import Career
from app.schemas.career import CareerCreate, CareerUpdate
from app.services.audit_service import AuditService
from app.shared.exceptions.exceptions import NotFoundError


class CareerService:
    def __init__(self, careers: CareerRepository, audit: AuditService):
        self.careers = careers
        self.audit = audit

    async def list(self, *, page: int, per_page: int, is_published: bool | None = None) -> tuple[list[Career], int]:
        return await self.careers.list(page=page, per_page=per_page, is_published=is_published)

    async def get(self, career_id: uuid.UUID) -> Career:
        career = await self.careers.get_by_id(career_id)
        if career is None:
            raise NotFoundError("Career posting not found.")
        return career

    async def create(self, payload: CareerCreate, actor_id: uuid.UUID) -> Career:
        data = payload.model_dump(exclude={"apply_email"})
        if not data.get("slug"):
            base_slug = payload.title.lower().strip()
            import re
            base_slug = re.sub(r"[^\w\s-]", "", base_slug)
            base_slug = re.sub(r"[\s_-]+", "-", base_slug).strip("-")[:200]
            data["slug"] = f"{base_slug}-{str(uuid.uuid4())[:8]}"
        if not data.get("department"):
            data["department"] = "General"
        if not data.get("location"):
            data["location"] = "Headquarters"
        if not data.get("employment_type"):
            data["employment_type"] = "Full-Time"
        if data.get("requirements") is None:
            data["requirements"] = ""
        if data.get("responsibilities") is None:
            data["responsibilities"] = ""
        if data.get("is_featured") is None:
            data["is_featured"] = False

        career = Career(**data)
        career = await self.careers.create(career)
        await self.audit.log(actor_id, "careers.create", "career", career.id)
        return career

    async def update(self, career_id: uuid.UUID, payload: CareerUpdate, actor_id: uuid.UUID) -> Career:
        career = await self.get(career_id)
        data = payload.model_dump(exclude_unset=True, exclude={"apply_email"})
        for field, value in data.items():
            setattr(career, field, value)
        career = await self.careers.update(career)
        await self.audit.log(actor_id, "careers.update", "career", career.id, details=data)
        return career

    async def delete(self, career_id: uuid.UUID, actor_id: uuid.UUID) -> None:
        career = await self.get(career_id)
        await self.careers.delete(career)
        await self.audit.log(actor_id, "careers.delete", "career", career_id)
