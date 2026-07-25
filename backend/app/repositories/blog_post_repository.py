import uuid
from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.blog_post import BlogPost, blog_post_category, blog_post_tag
from app.models.seo_meta import SeoMeta

_WITH_RELATIONS = (
    selectinload(BlogPost.author),
    selectinload(BlogPost.categories),
    selectinload(BlogPost.tags),
    selectinload(BlogPost.seo),
)


class SqlAlchemyBlogPostRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, post_id: uuid.UUID, include_deleted: bool = False) -> BlogPost | None:
        stmt = select(BlogPost).where(BlogPost.id == post_id).options(*_WITH_RELATIONS)
        if not include_deleted:
            stmt = stmt.where(BlogPost.deleted_at.is_(None))
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> BlogPost | None:
        stmt = (
            select(BlogPost)
            .where(BlogPost.slug == slug, BlogPost.deleted_at.is_(None))
            .options(*_WITH_RELATIONS)
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list(
        self,
        *,
        page: int,
        per_page: int,
        status: str | None = None,
        category_id: uuid.UUID | None = None,
        tag_id: uuid.UUID | None = None,
        author_id: uuid.UUID | None = None,
        search: str | None = None,
    ) -> tuple[list[BlogPost], int]:
        stmt = select(BlogPost).where(BlogPost.deleted_at.is_(None)).options(*_WITH_RELATIONS)
        count_stmt = select(func.count()).select_from(BlogPost).where(BlogPost.deleted_at.is_(None))

        if status:
            stmt = stmt.where(BlogPost.status == status)
            count_stmt = count_stmt.where(BlogPost.status == status)
        if author_id:
            stmt = stmt.where(BlogPost.author_id == author_id)
            count_stmt = count_stmt.where(BlogPost.author_id == author_id)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(or_(BlogPost.title.ilike(like), BlogPost.slug.ilike(like)))
            count_stmt = count_stmt.where(or_(BlogPost.title.ilike(like), BlogPost.slug.ilike(like)))
        if category_id:
            stmt = stmt.join(blog_post_category).where(blog_post_category.c.category_id == category_id)
            count_stmt = count_stmt.join(blog_post_category).where(blog_post_category.c.category_id == category_id)
        if tag_id:
            stmt = stmt.join(blog_post_tag).where(blog_post_tag.c.tag_id == tag_id)
            count_stmt = count_stmt.join(blog_post_tag).where(blog_post_tag.c.tag_id == tag_id)

        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(BlogPost.updated_at.desc()).offset((page - 1) * per_page).limit(per_page)
        rows = (await self.session.execute(stmt)).unique().scalars().all()
        return list(rows), total

    async def create(self, post: BlogPost) -> BlogPost:
        self.session.add(post)
        await self.session.commit()
        await self.session.refresh(post, attribute_names=["author", "categories", "tags", "seo"])
        return post

    async def update(self, post: BlogPost) -> BlogPost:
        await self.session.commit()
        await self.session.refresh(post, attribute_names=["author", "categories", "tags", "seo"])
        return post

    async def upsert_seo(self, post: BlogPost, seo_data: dict) -> BlogPost:
        if post.seo is None:
            seo = SeoMeta(**seo_data)
            self.session.add(seo)
            await self.session.flush()
            post.seo_id = seo.id
        else:
            for field, value in seo_data.items():
                setattr(post.seo, field, value)
        await self.session.commit()
        await self.session.refresh(post, attribute_names=["author", "categories", "tags", "seo"])
        return post

    async def list_trash(self, *, page: int, per_page: int) -> tuple[list[BlogPost], int]:
        stmt = select(BlogPost).where(BlogPost.deleted_at.isnot(None)).options(*_WITH_RELATIONS)
        count_stmt = select(func.count()).select_from(BlogPost).where(BlogPost.deleted_at.isnot(None))

        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(BlogPost.deleted_at.desc()).offset((page - 1) * per_page).limit(per_page)
        rows = (await self.session.execute(stmt)).unique().scalars().all()
        return list(rows), total

    async def soft_delete(self, post: BlogPost) -> None:
        post.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()

    async def restore(self, post: BlogPost) -> None:
        post.deleted_at = None
        await self.session.commit()
