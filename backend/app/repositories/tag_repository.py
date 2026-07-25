import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blog_post import blog_post_tag
from app.models.tag import Tag


class SqlAlchemyTagRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, tag_id: uuid.UUID) -> Tag | None:
        stmt = select(Tag).where(Tag.id == tag_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_by_ids(self, tag_ids: list[uuid.UUID]) -> list[Tag]:
        if not tag_ids:
            return []
        stmt = select(Tag).where(Tag.id.in_(tag_ids))
        return list((await self.session.execute(stmt)).scalars().all())

    async def list_all(self) -> list[Tag]:
        stmt = select(Tag).order_by(Tag.name)
        return list((await self.session.execute(stmt)).scalars().all())

    async def create(self, tag: Tag) -> Tag:
        self.session.add(tag)
        await self.session.commit()
        await self.session.refresh(tag)
        return tag

    async def update(self, tag: Tag) -> Tag:
        await self.session.commit()
        await self.session.refresh(tag)
        return tag

    async def delete(self, tag: Tag) -> None:
        await self.session.delete(tag)
        await self.session.commit()

    async def count_usage(self, tag_id: uuid.UUID) -> int:
        stmt = select(func.count()).select_from(blog_post_tag).where(blog_post_tag.c.tag_id == tag_id)
        return (await self.session.execute(stmt)).scalar_one()
