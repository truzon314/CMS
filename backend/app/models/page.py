import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PageType(str, enum.Enum):
    HOME = "HOME"
    ABOUT = "ABOUT"
    PROJECTS = "PROJECTS"
    BLOG = "BLOG"
    CONTACT = "CONTACT"
    CUSTOM = "CUSTOM"


class PageStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    PUBLISHED = "PUBLISHED"
    UNPUBLISHED = "UNPUBLISHED"


class Page(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Fixed to exactly 5 rows — `page_type` is a unique enum, not a free slug,
    so the "5 fixed pages" scope decision is enforced at the DB level, not just
    in application code (ERD.md).
    """

    __tablename__ = "pages"

    page_type: Mapped[PageType] = mapped_column(
        "pageType", Enum(PageType, name="PageType", create_type=False), unique=True, nullable=False
    )
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[PageStatus] = mapped_column(
        Enum(PageStatus, name="PageStatus", create_type=False), default=PageStatus.PUBLISHED, nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column("publishedAt", DateTime(timezone=True), default=None)
    scheduled_at: Mapped[datetime | None] = mapped_column("scheduledAt", DateTime(timezone=True), default=None)

    featured_image_media_id: Mapped[str | None] = mapped_column("featuredImageId", String(255), default=None)

    seo_id: Mapped[str | None] = mapped_column("seoId", String(255), ForeignKey("seo_meta.id"), default=None)
    created_by: Mapped[str | None] = mapped_column("createdById", String(255), ForeignKey("users.id"), default=None)
    updated_by: Mapped[str | None] = mapped_column("updatedById", String(255), ForeignKey("users.id"), default=None)

    seo: Mapped["SeoMeta | None"] = relationship()  # noqa: F821
    blocks: Mapped[list["PageBlock"]] = relationship(  # noqa: F821
        back_populates="page", order_by="PageBlock.position", cascade="all, delete-orphan"
    )
