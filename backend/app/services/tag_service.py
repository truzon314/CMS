import uuid

from app.shared.exceptions.exceptions import ConflictError, NotFoundError
from app.domain.repositories.tag_repository import TagRepository
from app.models.tag import Tag
from app.schemas.taxonomy import TagCreate, TagUpdate


class TagService:
    def __init__(self, tags: TagRepository):
        self.tags = tags

    async def list_all(self) -> list[Tag]:
        return await self.tags.list_all()

    async def get(self, tag_id: uuid.UUID) -> Tag:
        tag = await self.tags.get_by_id(tag_id)
        if not tag:
            raise NotFoundError("Tag not found.")
        return tag

    async def create(self, payload: TagCreate) -> Tag:
        tag = Tag(name=payload.name, slug=payload.slug)
        return await self.tags.create(tag)

    async def update(self, tag_id: uuid.UUID, payload: TagUpdate) -> Tag:
        tag = await self.get(tag_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(tag, field, value)
        return await self.tags.update(tag)

    async def delete(self, tag_id: uuid.UUID) -> None:
        tag = await self.get(tag_id)
        if await self.tags.count_usage(tag_id) > 0:
            raise ConflictError("This tag is assigned to posts — reassign them first.")
        await self.tags.delete(tag)
