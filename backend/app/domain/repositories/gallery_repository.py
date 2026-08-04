import uuid
from typing import Protocol

from app.models.gallery_item import GalleryItem


class GalleryRepository(Protocol):
    async def list(
        self, *, page: int, per_page: int, is_published: bool | None = None, category: str | None = None
    ) -> tuple[list[GalleryItem], int]: ...

    async def get_by_id(self, item_id: uuid.UUID) -> GalleryItem | None: ...

    async def create(self, item: GalleryItem) -> GalleryItem: ...

    async def update(self, item: GalleryItem) -> GalleryItem: ...

    async def delete(self, item: GalleryItem) -> None: ...
