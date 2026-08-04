import uuid

from app.shared.exceptions.exceptions import NotFoundError
from app.domain.repositories.category_repository import CategoryRepository
from app.models.category import Category
from app.schemas.taxonomy import CategoryCreate, CategoryUpdate


class CategoryService:
    def __init__(self, categories: CategoryRepository):
        self.categories = categories

    async def list_all(self, applies_to: str | None = None) -> list[Category]:
        return await self.categories.list_all(applies_to)

    async def get(self, category_id: uuid.UUID) -> Category:
        category = await self.categories.get_by_id(category_id)
        if not category:
            raise NotFoundError("Category not found.")
        return category

    async def create(self, payload: CategoryCreate) -> Category:
        category = Category(name=payload.name, slug=payload.slug, applies_to=payload.applies_to)
        return await self.categories.create(category)

    async def update(self, category_id: uuid.UUID, payload: CategoryUpdate) -> Category:
        category = await self.get(category_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(category, field, value)
        return await self.categories.update(category)

    async def delete(self, category_id: uuid.UUID) -> None:
        """Force-deletes the category regardless of usage — `property_category` and
        `blog_post_category`'s FK constraints are `ON DELETE CASCADE` (confirmed
        against the real DB, not just the SQLAlchemy model), so any posts/properties
        tagged with this category just lose that tag, nothing else breaks."""
        category = await self.get(category_id)
        await self.categories.delete(category)
