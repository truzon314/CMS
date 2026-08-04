import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.career import Career


class SqlAlchemyCareerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(
        self, *, page: int, per_page: int, is_published: bool | None = None
    ) -> tuple[list[Career], int]:
        conditions = []
        if is_published is not None:
            conditions.append(Career.is_published == is_published)

        count_stmt = select(func.count()).select_from(Career)
        for condition in conditions:
            count_stmt = count_stmt.where(condition)
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = select(Career).order_by(Career.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        for condition in conditions:
            stmt = stmt.where(condition)
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), total

    async def get_by_id(self, career_id: uuid.UUID) -> Career | None:
        stmt = select(Career).where(Career.id == career_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create(self, career: Career) -> Career:
        self.session.add(career)
        await self.session.commit()
        await self.session.refresh(career)
        return career

    async def update(self, career: Career) -> Career:
        await self.session.commit()
        await self.session.refresh(career)
        return career

    async def delete(self, career: Career) -> None:
        await self.session.delete(career)
        await self.session.commit()
