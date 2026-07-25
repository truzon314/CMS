import math
import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.models.user import User
from app.schemas.blog import BlogPostCreate, BlogPostListItem, BlogPostRead, BlogPostUpdate, BlogScheduleRequest
from app.schemas.version import EntityVersionRead
from app.services.blog_service import BlogPostService
from app.shared.dependencies.container import get_blog_service
from app.shared.utils.common import PaginationMeta, ok

router = APIRouter(prefix="/blog", tags=["blog"])


@router.get("/posts")
async def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str | None = None,
    category: uuid.UUID | None = None,
    tag: uuid.UUID | None = None,
    author_id: uuid.UUID | None = None,
    search: str | None = None,
    blog_service: BlogPostService = Depends(get_blog_service),
    _=Depends(require_permission("blog.view")),
):
    posts, total = await blog_service.list_posts(
        page=page,
        per_page=per_page,
        status=status,
        category_id=category,
        tag_id=tag,
        author_id=author_id,
        search=search,
    )
    data = [
        BlogPostListItem(
            id=p.id,
            title=p.title,
            slug=p.slug,
            status=p.status,
            author_name=p.author.full_name,
            category_names=[c.name for c in p.categories],
            is_featured=p.is_featured,
            published_at=p.published_at,
            updated_at=p.updated_at,
        ).model_dump(mode="json")
        for p in posts
    ]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.post("/posts")
async def create_post(
    payload: BlogPostCreate,
    blog_service: BlogPostService = Depends(get_blog_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("blog.create")),
):
    post = await blog_service.create(payload, user.id)
    return ok(BlogPostRead.model_validate(post).model_dump(mode="json"))


@router.get("/posts/{post_id}")
async def get_post(
    post_id: uuid.UUID,
    blog_service: BlogPostService = Depends(get_blog_service),
    _=Depends(require_permission("blog.view")),
):
    post = await blog_service.get(post_id)
    return ok(BlogPostRead.model_validate(post).model_dump(mode="json"))


@router.put("/posts/{post_id}")
async def update_post(
    post_id: uuid.UUID,
    payload: BlogPostUpdate,
    blog_service: BlogPostService = Depends(get_blog_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("blog.edit")),
):
    post = await blog_service.update(post_id, payload, user.id)
    return ok(BlogPostRead.model_validate(post).model_dump(mode="json"))


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: uuid.UUID,
    blog_service: BlogPostService = Depends(get_blog_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("blog.delete")),
):
    await blog_service.soft_delete(post_id, user.id)
    return ok({"deleted": True})


@router.post("/posts/{post_id}/restore")
async def restore_post(
    post_id: uuid.UUID,
    blog_service: BlogPostService = Depends(get_blog_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("blog.delete")),
):
    post = await blog_service.restore(post_id, user.id)
    return ok(BlogPostRead.model_validate(post).model_dump(mode="json"))


@router.post("/posts/{post_id}/duplicate")
async def duplicate_post(
    post_id: uuid.UUID,
    blog_service: BlogPostService = Depends(get_blog_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("blog.create")),
):
    post = await blog_service.duplicate(post_id, user.id)
    return ok(BlogPostRead.model_validate(post).model_dump(mode="json"))


@router.post("/posts/{post_id}/publish")
async def publish_post(
    post_id: uuid.UUID,
    blog_service: BlogPostService = Depends(get_blog_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("blog.publish")),
):
    post = await blog_service.publish(post_id, user.id)
    return ok(BlogPostRead.model_validate(post).model_dump(mode="json"))


@router.post("/posts/{post_id}/unpublish")
async def unpublish_post(
    post_id: uuid.UUID,
    blog_service: BlogPostService = Depends(get_blog_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("blog.publish")),
):
    post = await blog_service.unpublish(post_id, user.id)
    return ok(BlogPostRead.model_validate(post).model_dump(mode="json"))


@router.post("/posts/{post_id}/schedule")
async def schedule_post(
    post_id: uuid.UUID,
    payload: BlogScheduleRequest,
    blog_service: BlogPostService = Depends(get_blog_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("blog.publish")),
):
    post = await blog_service.schedule(post_id, payload.scheduled_at, user.id)
    return ok(BlogPostRead.model_validate(post).model_dump(mode="json"))


@router.get("/posts/{post_id}/versions")
async def list_post_versions(
    post_id: uuid.UUID,
    blog_service: BlogPostService = Depends(get_blog_service),
    _=Depends(require_permission("blog.view")),
):
    versions = await blog_service.list_versions(post_id)
    return ok([EntityVersionRead.model_validate(v).model_dump(mode="json") for v in versions])


@router.post("/posts/{post_id}/versions/{version_id}/restore")
async def restore_post_version(
    post_id: uuid.UUID,
    version_id: uuid.UUID,
    blog_service: BlogPostService = Depends(get_blog_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("blog.edit")),
):
    post = await blog_service.restore_version(post_id, version_id, user.id)
    return ok(BlogPostRead.model_validate(post).model_dump(mode="json"))
