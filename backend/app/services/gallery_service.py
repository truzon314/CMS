import uuid

from app.domain.repositories.gallery_repository import GalleryRepository
from app.models.gallery_item import GalleryItem
from app.schemas.gallery import GalleryItemCreate, GalleryItemUpdate
from app.services.audit_service import AuditService
from app.shared.exceptions.exceptions import NotFoundError


class GalleryService:
    def __init__(self, items: GalleryRepository, audit: AuditService):
        self.items = items
        self.audit = audit

    async def list(
        self, *, page: int, per_page: int, is_published: bool | None = None, category: str | None = None
    ) -> tuple[list[GalleryItem], int]:
        return await self.items.list(page=page, per_page=per_page, is_published=is_published, category=category)

    async def get(self, item_id: uuid.UUID) -> GalleryItem:
        item = await self.items.get_by_id(item_id)
        if item is None:
            raise NotFoundError("Gallery item not found.")
        return item

    async def create(self, payload: GalleryItemCreate, actor_id: uuid.UUID) -> GalleryItem:
        item = GalleryItem(**payload.model_dump())
        item = await self.items.create(item)
        await self.audit.log(actor_id, "gallery.create", "gallery_item", item.id)
        return item

    async def update(self, item_id: uuid.UUID, payload: GalleryItemUpdate, actor_id: uuid.UUID) -> GalleryItem:
        item = await self.get(item_id)
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(item, field, value)
        item = await self.items.update(item)
        await self.audit.log(actor_id, "gallery.update", "gallery_item", item.id, details=data)
        return item

    async def delete(self, item_id: uuid.UUID, actor_id: uuid.UUID) -> None:
        item = await self.get(item_id)
        await self.items.delete(item)
        await self.audit.log(actor_id, "gallery.delete", "gallery_item", item_id)
