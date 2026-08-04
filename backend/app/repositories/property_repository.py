import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.property import Property, property_category
from app.models.property_media import PropertyMedia
from app.models.seo_meta import SeoMeta

_WITH_RELATIONS = (
    selectinload(Property.categories),
    selectinload(Property.gallery),
    selectinload(Property.seo),
)


class SqlAlchemyPropertyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, property_id: uuid.UUID, include_deleted: bool = False) -> Property | None:
        stmt = select(Property).where(Property.id == property_id).options(*_WITH_RELATIONS)
        if not include_deleted:
            stmt = stmt.where(Property.deleted_at.is_(None))
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Property | None:
        stmt = (
            select(Property)
            .where(Property.slug == slug, Property.deleted_at.is_(None))
            .options(*_WITH_RELATIONS)
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list(
        self,
        *,
        page: int,
        per_page: int,
        status: str | None = None,
        city: str | None = None,
        category_id: uuid.UUID | None = None,
        budget_bracket: str | None = None,
        search: str | None = None,
        is_signature: bool | None = None,
    ) -> tuple[list[Property], int]:
        stmt = select(Property).where(Property.deleted_at.is_(None)).options(*_WITH_RELATIONS)
        count_stmt = select(func.count()).select_from(Property).where(Property.deleted_at.is_(None))

        if status:
            stmt = stmt.where(Property.status == status)
            count_stmt = count_stmt.where(Property.status == status)
        if is_signature is not None:
            stmt = stmt.where(Property.is_signature == is_signature)
            count_stmt = count_stmt.where(Property.is_signature == is_signature)
        if city:
            stmt = stmt.where(Property.city == city)
            count_stmt = count_stmt.where(Property.city == city)
        if budget_bracket:
            stmt = stmt.where(Property.budget_bracket == budget_bracket)
            count_stmt = count_stmt.where(Property.budget_bracket == budget_bracket)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(or_(Property.name.ilike(like), Property.slug.ilike(like)))
            count_stmt = count_stmt.where(or_(Property.name.ilike(like), Property.slug.ilike(like)))
        if category_id:
            stmt = stmt.join(property_category).where(property_category.c.category_id == category_id)
            count_stmt = count_stmt.join(property_category).where(property_category.c.category_id == category_id)

        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = (
            stmt.order_by(Property.sort_order.asc(), Property.updated_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        rows = (await self.session.execute(stmt)).unique().scalars().all()
        return list(rows), total

    async def reorder(self, ordered_ids: list[uuid.UUID]) -> None:
        stmt = select(Property).where(Property.id.in_(ordered_ids))
        properties = {p.id: p for p in (await self.session.execute(stmt)).scalars().all()}
        for position, property_id in enumerate(ordered_ids):
            if property_id in properties:
                properties[property_id].sort_order = position
        await self.session.commit()

    async def list_trash(self, *, page: int, per_page: int) -> tuple[list[Property], int]:
        stmt = select(Property).where(Property.deleted_at.isnot(None)).options(*_WITH_RELATIONS)
        count_stmt = select(func.count()).select_from(Property).where(Property.deleted_at.isnot(None))

        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(Property.deleted_at.desc()).offset((page - 1) * per_page).limit(per_page)
        rows = (await self.session.execute(stmt)).unique().scalars().all()
        return list(rows), total

    async def create(self, property_: Property) -> Property:
        self.session.add(property_)
        await self.session.commit()
        await self.session.refresh(property_, attribute_names=["categories", "gallery", "seo"])
        return property_

    async def update(self, property_: Property) -> Property:
        await self.session.commit()
        await self.session.refresh(property_, attribute_names=["categories", "gallery", "seo"])
        return property_

    async def upsert_seo(self, property_: Property, seo_data: dict) -> Property:
        if property_.seo is None:
            seo = SeoMeta(**seo_data)
            self.session.add(seo)
            await self.session.flush()
            property_.seo_id = seo.id
        else:
            for field, value in seo_data.items():
                setattr(property_.seo, field, value)
        await self.session.commit()
        await self.session.refresh(property_, attribute_names=["categories", "gallery", "seo"])
        return property_

    async def set_gallery(self, property_id: uuid.UUID, media_ids: list[uuid.UUID]) -> Property:
        await self.session.execute(delete(PropertyMedia).where(PropertyMedia.property_id == property_id))
        for position, media_id in enumerate(media_ids):
            self.session.add(PropertyMedia(property_id=property_id, media_id=media_id, position=position))
        await self.session.commit()
        return await self.get_by_id(property_id)

    async def soft_delete(self, property_: Property) -> None:
        property_.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()

    async def restore(self, property_: Property) -> None:
        property_.deleted_at = None
        await self.session.commit()
