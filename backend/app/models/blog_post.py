import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

blog_post_category = Table(
    "blog_post_category",
    Base.metadata,
    Column("blog_post_id", UUID(as_uuid=True), ForeignKey("blog_post.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("category.id", ondelete="CASCADE"), primary_key=True),
)

blog_post_tag = Table(
    "blog_post_tag",
    Base.metadata,
    Column("blog_post_id", UUID(as_uuid=True), ForeignKey("blog_post.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True),
)


class BlogPostStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"


class BlogPost(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "blog_post"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    excerpt: Mapped[str | None] = mapped_column(Text, default=None)
    body: Mapped[str | None] = mapped_column(Text, default=None)
    featured_image_media_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), default=None)
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    status: Mapped[BlogPostStatus] = mapped_column(
        Enum(BlogPostStatus, name="blog_post_status"), default=BlogPostStatus.DRAFT, nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    reading_time_minutes: Mapped[int | None] = mapped_column(Integer, default=None)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    seo_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("seo_meta.id"), default=None)

    seo: Mapped["SeoMeta | None"] = relationship()  # noqa: F821
    author: Mapped["User"] = relationship()  # noqa: F821
    categories: Mapped[list["Category"]] = relationship(secondary=blog_post_category)  # noqa: F821
    tags: Mapped[list["Tag"]] = relationship(secondary=blog_post_tag)  # noqa: F821

    @property
    def author_name(self) -> str:
        """Lets `BlogPostRead.model_validate(post)` (from_attributes) pick this
        up via plain getattr, without every read schema needing a manual
        author-join construction — `author` is always selectinloaded."""
        return self.author.full_name
