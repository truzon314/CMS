import uuid

from app.core.exceptions import NotFoundError
from app.domain.repositories.blog_post_repository import BlogPostRepository
from app.domain.repositories.media_repository import MediaRepository
from app.domain.repositories.property_repository import PropertyRepository
from app.services.audit_service import AuditService

_ENTITY_TYPES = {"blog_post", "property", "media"}


class TrashItem:
    def __init__(self, entity_type: str, id: uuid.UUID, title: str, deleted_at):
        self.entity_type = entity_type
        self.id = id
        self.title = title
        self.deleted_at = deleted_at


class TrashService:
    """`WHERE deleted_at IS NOT NULL` across the 3 soft-deletable content
    types that actually have a restore-and-reuse workflow (blog posts,
    properties, media). Users are soft-deletable too, but that's an
    account-lifecycle action handled in the Users module, not Trash."""

    def __init__(
        self,
        posts: BlogPostRepository,
        properties: PropertyRepository,
        media: MediaRepository,
        audit: AuditService,
    ):
        self.posts = posts
        self.properties = properties
        self.media = media
        self.audit = audit

    async def list_trash(self, *, entity_type: str | None, page: int, per_page: int) -> tuple[list[TrashItem], int]:
        items: list[TrashItem] = []
        total = 0

        if entity_type is None or entity_type == "blog_post":
            posts, count = await self.posts.list_trash(page=page, per_page=per_page)
            items += [TrashItem("blog_post", p.id, p.title, p.deleted_at) for p in posts]
            total += count

        if entity_type is None or entity_type == "property":
            properties, count = await self.properties.list_trash(page=page, per_page=per_page)
            items += [TrashItem("property", p.id, p.name, p.deleted_at) for p in properties]
            total += count

        if entity_type is None or entity_type == "media":
            media_items, count = await self.media.list_trash(page=page, per_page=per_page)
            items += [TrashItem("media", m.id, m.file_name, m.deleted_at) for m in media_items]
            total += count

        items.sort(key=lambda i: i.deleted_at, reverse=True)
        return items, total

    async def restore(self, entity_type: str, entity_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> None:
        if entity_type not in _ENTITY_TYPES:
            raise NotFoundError("Unknown trash entity type.")

        if entity_type == "blog_post":
            post = await self.posts.get_by_id(entity_id, include_deleted=True)
            if not post:
                raise NotFoundError("Blog post not found.")
            await self.posts.restore(post)
            await self.audit.log(actor_id, "blog.restore", "blog_post", entity_id, details={"title": post.title})
        elif entity_type == "property":
            property_ = await self.properties.get_by_id(entity_id, include_deleted=True)
            if not property_:
                raise NotFoundError("Property not found.")
            await self.properties.restore(property_)
            await self.audit.log(actor_id, "property.restore", "property", entity_id, details={"name": property_.name})
        else:
            media = await self.media.get_by_id(entity_id, include_deleted=True)
            if not media:
                raise NotFoundError("Media not found.")
            await self.media.restore(media)
            await self.audit.log(actor_id, "media.restore", "media", entity_id, details={"file_name": media.file_name})
