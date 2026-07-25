import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PageType(str, enum.Enum):
    HOME = "home"
    ABOUT = "about"
    PROJECTS = "projects"
    BLOG = "blog"
    CONTACT = "contact"


class PageStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"


class Page(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Fixed to exactly 5 rows — `page_type` is a unique enum, not a free slug,
    so the "5 fixed pages" scope decision is enforced at the DB level, not just
    in application code (ERD.md).
    """

    __tablename__ = "page"

    page_type: Mapped[PageType] = mapped_column(Enum(PageType, name="page_type"), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[PageStatus] = mapped_column(
        Enum(PageStatus, name="page_status"), default=PageStatus.DRAFT, nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    # No FK constraint yet — `media` doesn't exist until Phase 3.
    featured_image_media_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), default=None)

    seo_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("seo_meta.id"), default=None)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    updated_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)

    seo: Mapped["SeoMeta | None"] = relationship()  # noqa: F821
    blocks: Mapped[list["PageBlock"]] = relationship(  # noqa: F821
        back_populates="page", order_by="PageBlock.position", cascade="all, delete-orphan"
    )
