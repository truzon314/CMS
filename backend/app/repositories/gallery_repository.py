import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gallery_item import GalleryItem


class SqlAlchemyGalleryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(
        self,
        *,
        page: int,
        per_page: int,
        is_published: bool | None = None,
        category: str | None = None,
    ) -> tuple[list[GalleryItem], int]:
        conditions = []
        if is_published is not None:
            conditions.append(GalleryItem.is_published == is_published)
        if category is not None:
            conditions.append(GalleryItem.category == category)

        count_stmt = select(func.count()).select_from(GalleryItem)
        for condition in conditions:
            count_stmt = count_stmt.where(condition)
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = (
            select(GalleryItem)
            .order_by(GalleryItem.sort_order.asc(), GalleryItem.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        for condition in conditions:
            stmt = stmt.where(condition)
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), total

    async def get_by_id(self, item_id: uuid.UUID) -> GalleryItem | None:
        stmt = select(GalleryItem).where(GalleryItem.id == item_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create(self, item: GalleryItem) -> GalleryItem:
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def update(self, item: GalleryItem) -> GalleryItem:
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def delete(self, item: GalleryItem) -> None:
        await self.session.delete(item)
        await self.session.commit()
