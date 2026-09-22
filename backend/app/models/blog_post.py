import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Table, Text

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

blog_post_category = Table(
    "_BlogPostCategories",
    Base.metadata,
    Column("A", String(255), ForeignKey("blog_posts.id", ondelete="CASCADE"), primary_key=True),
    Column("B", String(255), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)

blog_post_tag = Table(
    "_BlogPostTags",
    Base.metadata,
    Column("A", String(255), ForeignKey("blog_posts.id", ondelete="CASCADE"), primary_key=True),
    Column("B", String(255), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class BlogPostStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    PUBLISHED = "PUBLISHED"


class BlogPost(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "blog_posts"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    excerpt: Mapped[str | None] = mapped_column(Text, default=None)
    body: Mapped[str | None] = mapped_column(Text, default=None)
    featured_image_media_id: Mapped[str | None] = mapped_column("featuredImageId", String(255), default=None)
    author_id: Mapped[str | None] = mapped_column("authorId", String(255), ForeignKey("users.id"), default=None)
    status: Mapped[BlogPostStatus] = mapped_column(
        Enum(BlogPostStatus, name="BlogStatus", create_type=False), default=BlogPostStatus.PUBLISHED, nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column("publishedAt", DateTime(timezone=True), default=None)
    scheduled_at: Mapped[datetime | None] = mapped_column("scheduledAt", DateTime(timezone=True), default=None)
    reading_time_minutes: Mapped[int | None] = mapped_column("readingTimeMinutes", Integer, default=None)
    is_featured: Mapped[bool] = mapped_column("isFeatured", Boolean, default=False)
    seo_id: Mapped[str | None] = mapped_column("seoId", String(255), ForeignKey("seo_meta.id"), default=None)

    seo: Mapped["SeoMeta | None"] = relationship()  # noqa: F821
    author: Mapped["User"] = relationship()  # noqa: F821
    categories: Mapped[list["Category"]] = relationship(secondary=blog_post_category)  # noqa: F821
    tags: Mapped[list["Tag"]] = relationship(secondary=blog_post_tag)  # noqa: F821

    @property
    def featured_image_media_id(self) -> str | None:
        return self.featured_image_id

    @featured_image_media_id.setter
    def featured_image_media_id(self, value: str | None) -> None:
        self.featured_image_id = value

    @property
    def author_name(self) -> str:
        """Lets `BlogPostRead.model_validate(post)` (from_attributes) pick this
        up via plain getattr, without every read schema needing a manual
        author-join construction — `author` is always selectinloaded."""
        return self.author.full_name

    @author_name.setter
    def author_name(self, value: str) -> None:
        pass
