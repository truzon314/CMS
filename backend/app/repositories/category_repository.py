import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.blog_post import blog_post_category
from app.models.category import Category
from app.models.property import property_category


class SqlAlchemyCategoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, category_id: uuid.UUID) -> Category | None:
        stmt = select(Category).where(Category.id == category_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_by_ids(self, category_ids: list[uuid.UUID]) -> list[Category]:
        if not category_ids:
            return []
        stmt = select(Category).where(Category.id.in_(category_ids))
        return list((await self.session.execute(stmt)).scalars().all())

    async def list_all(self, applies_to: str | None = None) -> list[Category]:
        stmt = select(Category)
        if applies_to:
            stmt = stmt.where(Category.applies_to.in_([applies_to, "both"]))
        stmt = stmt.order_by(Category.name)
        return list((await self.session.execute(stmt)).scalars().all())

    async def create(self, category: Category) -> Category:
        self.session.add(category)
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def update(self, category: Category) -> Category:
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def delete(self, category: Category) -> None:
        await self.session.delete(category)
        await self.session.commit()

    async def count_usage(self, category_id: uuid.UUID) -> int:
        blog_count_stmt = (
            select(func.count()).select_from(blog_post_category).where(blog_post_category.c.category_id == category_id)
        )
        blog_count = (await self.session.execute(blog_count_stmt)).scalar_one()
        property_count_stmt = (
            select(func.count()).select_from(property_category).where(property_category.c.category_id == category_id)
        )
        property_count = (await self.session.execute(property_count_stmt)).scalar_one()
        return blog_count + property_count
