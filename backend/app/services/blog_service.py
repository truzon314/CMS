import math
import uuid
from datetime import datetime, timezone

from app.shared.exceptions.exceptions import ConflictError, NotFoundError
from app.domain.repositories.blog_post_repository import BlogPostRepository
from app.domain.repositories.category_repository import CategoryRepository
from app.domain.repositories.entity_version_repository import EntityVersionRepository
from app.domain.repositories.media_usage_repository import MediaUsageRepository
from app.domain.repositories.tag_repository import TagRepository
from app.models.blog_post import BlogPost, BlogPostStatus
from app.models.entity_version import EntityType, EntityVersion
from app.models.media_usage import MediaUsageEntityType
from app.schemas.blog import BlogPostCreate, BlogPostUpdate
from app.services.audit_service import AuditService

_FEATURED_IMAGE_FIELD = "featured_image"
_WPM = 200


def _estimate_reading_time(body: str | None) -> int:
    word_count = len((body or "").split())
    return max(1, math.ceil(word_count / _WPM))


class BlogPostService:
    def __init__(
        self,
        posts: BlogPostRepository,
        categories: CategoryRepository,
        tags: TagRepository,
        versions: EntityVersionRepository,
        media_usage: MediaUsageRepository,
        audit: AuditService,
    ):
        self.posts = posts
        self.categories = categories
        self.tags = tags
        self.versions = versions
        self.media_usage = media_usage
        self.audit = audit

    async def list_posts(
        self,
        *,
        page: int,
        per_page: int,
        status: str | None,
        category_id: uuid.UUID | None,
        tag_id: uuid.UUID | None,
        author_id: uuid.UUID | None,
        search: str | None,
    ) -> tuple[list[BlogPost], int]:
        return await self.posts.list(
            page=page,
            per_page=per_page,
            status=status,
            category_id=category_id,
            tag_id=tag_id,
            author_id=author_id,
            search=search,
        )

    async def get(self, post_id: uuid.UUID) -> BlogPost:
        post = await self.posts.get_by_id(post_id)
        if not post:
            raise NotFoundError("Blog post not found.")
        return post

    async def create(self, payload: BlogPostCreate, user_id: uuid.UUID) -> BlogPost:
        if await self.posts.get_by_slug(payload.slug):
            raise ConflictError(f"Slug '{payload.slug}' is already in use.")

        post = BlogPost(
            title=payload.title,
            slug=payload.slug,
            excerpt=payload.excerpt,
            body=payload.body,
            featured_image_media_id=payload.featured_image_media_id,
            author_id=user_id,
            reading_time_minutes=payload.reading_time_minutes or _estimate_reading_time(payload.body),
            is_featured=payload.is_featured,
        )
        post.categories = await self.categories.list_by_ids(payload.category_ids)
        post.tags = await self.tags.list_by_ids(payload.tag_ids)
        post = await self.posts.create(post)
        await self._sync_featured_image_usage(post)
        await self._snapshot(post, user_id, "Created")
        return post

    async def update(self, post_id: uuid.UUID, payload: BlogPostUpdate, user_id: uuid.UUID) -> BlogPost:
        post = await self.get(post_id)
        data = payload.model_dump(exclude_unset=True, exclude={"category_ids", "tag_ids", "seo"})

        if "slug" in data and data["slug"] != post.slug:
            existing = await self.posts.get_by_slug(data["slug"])
            if existing and existing.id != post.id:
                raise ConflictError(f"Slug '{data['slug']}' is already in use.")

        for field, value in data.items():
            setattr(post, field, value)

        if payload.category_ids is not None:
            post.categories = await self.categories.list_by_ids(payload.category_ids)
        if payload.tag_ids is not None:
            post.tags = await self.tags.list_by_ids(payload.tag_ids)

        post = await self.posts.update(post)
        await self._sync_featured_image_usage(post)

        if payload.seo is not None:
            seo_data = payload.seo.model_dump(exclude_unset=True)
            post = await self.posts.upsert_seo(post, seo_data)

        await self._snapshot(post, user_id, "Updated post")
        return post

    async def duplicate(self, post_id: uuid.UUID, user_id: uuid.UUID) -> BlogPost:
        original = await self.get(post_id)
        slug = f"{original.slug}-copy"
        suffix = 2
        while await self.posts.get_by_slug(slug):
            slug = f"{original.slug}-copy-{suffix}"
            suffix += 1

        copy = BlogPost(
            title=f"{original.title} (Copy)",
            slug=slug,
            excerpt=original.excerpt,
            body=original.body,
            featured_image_media_id=original.featured_image_media_id,
            author_id=user_id,
            status=BlogPostStatus.DRAFT,
            reading_time_minutes=original.reading_time_minutes,
            is_featured=False,
        )
        copy.categories = list(original.categories)
        copy.tags = list(original.tags)
        copy = await self.posts.create(copy)
        await self._snapshot(copy, user_id, "Duplicated")
        return copy

    async def soft_delete(self, post_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> None:
        post = await self.get(post_id)
        await self.posts.soft_delete(post)
        await self.audit.log(actor_id, "blog.delete", "blog_post", post.id, details={"title": post.title})

    async def restore(self, post_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> BlogPost:
        post = await self.posts.get_by_id(post_id, include_deleted=True)
        if not post:
            raise NotFoundError("Blog post not found.")
        await self.posts.restore(post)
        await self.audit.log(actor_id, "blog.restore", "blog_post", post.id, details={"title": post.title})
        return await self.get(post_id)

    async def publish(self, post_id: uuid.UUID, user_id: uuid.UUID) -> BlogPost:
        post = await self.get(post_id)
        post.status = BlogPostStatus.PUBLISHED
        post.published_at = datetime.now(timezone.utc)
        post.scheduled_at = None
        post = await self.posts.update(post)
        await self._snapshot(post, user_id, "Published")
        return post

    async def unpublish(self, post_id: uuid.UUID, user_id: uuid.UUID) -> BlogPost:
        post = await self.get(post_id)
        post.status = BlogPostStatus.DRAFT
        post = await self.posts.update(post)
        await self._snapshot(post, user_id, "Unpublished")
        return post

    async def schedule(self, post_id: uuid.UUID, scheduled_at: datetime, user_id: uuid.UUID) -> BlogPost:
        post = await self.get(post_id)
        post.status = BlogPostStatus.SCHEDULED
        post.scheduled_at = scheduled_at
        post = await self.posts.update(post)
        await self._snapshot(post, user_id, f"Scheduled for {scheduled_at.isoformat()}")
        return post

    async def list_versions(self, post_id: uuid.UUID) -> list[EntityVersion]:
        post = await self.get(post_id)
        return await self.versions.list_for_entity(EntityType.BLOG_POST, post.id)

    async def restore_version(self, post_id: uuid.UUID, version_id: uuid.UUID, user_id: uuid.UUID) -> BlogPost:
        post = await self.get(post_id)
        version = await self.versions.get_by_id(version_id)
        if not version or version.entity_id != post.id:
            raise NotFoundError("Version not found.")

        snapshot = version.snapshot
        post.title = snapshot["title"]
        post.excerpt = snapshot["excerpt"]
        post.body = snapshot["body"]
        featured_image_media_id = snapshot["featured_image_media_id"]
        post.featured_image_media_id = uuid.UUID(featured_image_media_id) if featured_image_media_id else None
        post.categories = await self.categories.list_by_ids([uuid.UUID(c) for c in snapshot["category_ids"]])
        post.tags = await self.tags.list_by_ids([uuid.UUID(t) for t in snapshot["tag_ids"]])
        post = await self.posts.update(post)
        await self._sync_featured_image_usage(post)
        await self._snapshot(post, user_id, f"Restored version {version.version_number}")
        return post

    async def _sync_featured_image_usage(self, post: BlogPost) -> None:
        if post.featured_image_media_id:
            await self.media_usage.upsert(
                MediaUsageEntityType.BLOG_POST, post.id, _FEATURED_IMAGE_FIELD, post.featured_image_media_id
            )
        else:
            await self.media_usage.delete_for_field(MediaUsageEntityType.BLOG_POST, post.id, _FEATURED_IMAGE_FIELD)

    async def _snapshot(self, post: BlogPost, user_id: uuid.UUID, note: str) -> None:
        version_number = await self.versions.next_version_number(EntityType.BLOG_POST, post.id)
        snapshot = {
            "title": post.title,
            "excerpt": post.excerpt,
            "body": post.body,
            "featured_image_media_id": str(post.featured_image_media_id) if post.featured_image_media_id else None,
            "category_ids": [str(c.id) for c in post.categories],
            "tag_ids": [str(t.id) for t in post.tags],
        }
        version = EntityVersion(
            entity_type=EntityType.BLOG_POST,
            entity_id=post.id,
            version_number=version_number,
            snapshot=snapshot,
            change_note=note,
            created_by=user_id,
        )
        await self.versions.create(version)
        await self.audit.log(user_id, f"blog.{note}", "blog_post", post.id, details={"title": post.title})
