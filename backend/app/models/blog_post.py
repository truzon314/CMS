import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

blog_post_category = Table(
    "blog_post_categories",
    Base.metadata,
    Column("blogPostId", String, ForeignKey("blog_posts.id", ondelete="CASCADE"), primary_key=True),
    Column("categoryId", String, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)

blog_post_tag = Table(
    "blog_post_tags",
    Base.metadata,
    Column("blogPostId", String, ForeignKey("blog_posts.id", ondelete="CASCADE"), primary_key=True),
    Column("tagId", String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class BlogPostStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"


class BlogPost(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "blog_posts"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    excerpt: Mapped[str | None] = mapped_column(Text, default=None)
    body: Mapped[str | None] = mapped_column(Text, default=None)
    featured_image_media_id: Mapped[str | None] = mapped_column("featuredImageMediaId", String, default=None)
    author_id: Mapped[str] = mapped_column("authorId", String, ForeignKey("users.id"), nullable=False)
    status: Mapped[BlogPostStatus] = mapped_column(
        Enum(BlogPostStatus, name="BlogPostStatus", create_type=False), default=BlogPostStatus.DRAFT, nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column("publishedAt", DateTime(timezone=True), default=None)
    scheduled_at: Mapped[datetime | None] = mapped_column("scheduledAt", DateTime(timezone=True), default=None)
    reading_time_minutes: Mapped[int | None] = mapped_column("readingTimeMinutes", Integer, default=None)
    is_featured: Mapped[bool] = mapped_column("isFeatured", Boolean, default=False)
    seo_id: Mapped[str | None] = mapped_column("seoId", String, ForeignKey("seo_metas.id"), default=None)

    seo: Mapped["SeoMeta | None"] = relationship()  # noqa: F821
    author: Mapped["User"] = relationship()  # noqa: F821
    categories: Mapped[list["Category"]] = relationship(secondary=blog_post_category)  # noqa: F821
    tags: Mapped[list["Tag"]] = relationship(secondary=blog_post_tag)  # noqa: F821

    @property
    def author_name(self) -> str:
        return self.author.full_name if self.author else ""

