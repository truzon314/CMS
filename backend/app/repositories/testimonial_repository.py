import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.testimonial import Testimonial


class SqlAlchemyTestimonialRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(
        self,
        *,
        page: int,
        per_page: int,
        is_published: bool | None = None,
        featured_only: bool = False,
    ) -> tuple[list[Testimonial], int]:
        conditions = []
        if is_published is not None:
            conditions.append(Testimonial.is_published == is_published)
        if featured_only:
            conditions.append(Testimonial.is_featured.is_(True))

        count_stmt = select(func.count()).select_from(Testimonial)
        for condition in conditions:
            count_stmt = count_stmt.where(condition)
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = select(Testimonial).order_by(Testimonial.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        for condition in conditions:
            stmt = stmt.where(condition)
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), total

    async def get_by_id(self, testimonial_id: uuid.UUID) -> Testimonial | None:
        stmt = select(Testimonial).where(Testimonial.id == testimonial_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create(self, testimonial: Testimonial) -> Testimonial:
        self.session.add(testimonial)
        await self.session.commit()
        await self.session.refresh(testimonial)
        return testimonial

    async def update(self, testimonial: Testimonial) -> Testimonial:
        await self.session.commit()
        await self.session.refresh(testimonial)
        return testimonial

    async def delete(self, testimonial: Testimonial) -> None:
        await self.session.delete(testimonial)
        await self.session.commit()
