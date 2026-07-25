import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.blog_post import BlogPostStatus
from app.schemas.seo import SeoMetaInput, SeoMetaRead
from app.schemas.taxonomy import CategoryRead, TagRead
from app.schemas.validators import Slug


class BlogPostListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    status: BlogPostStatus
    author_name: str
    category_names: list[str]
    is_featured: bool
    published_at: datetime | None
    updated_at: datetime


class BlogPostRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    excerpt: str | None
    body: str | None
    featured_image_media_id: uuid.UUID | None
    author_id: uuid.UUID
    author_name: str
    status: BlogPostStatus
    published_at: datetime | None
    scheduled_at: datetime | None
    reading_time_minutes: int | None
    is_featured: bool
    seo: SeoMetaRead | None
    categories: list[CategoryRead]
    tags: list[TagRead]
    created_at: datetime
    updated_at: datetime


class BlogPostCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    slug: Slug
    excerpt: str | None = None
    body: str | None = None
    featured_image_media_id: uuid.UUID | None = None
    category_ids: list[uuid.UUID] = []
    tag_ids: list[uuid.UUID] = []
    reading_time_minutes: int | None = None
    is_featured: bool = False


class BlogPostUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = None
    slug: Slug | None = None
    excerpt: str | None = None
    body: str | None = None
    featured_image_media_id: uuid.UUID | None = None
    category_ids: list[uuid.UUID] | None = None
    tag_ids: list[uuid.UUID] | None = None
    reading_time_minutes: int | None = None
    is_featured: bool | None = None
    seo: SeoMetaInput | None = None


class BlogScheduleRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scheduled_at: datetime
