import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


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


class Page(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "pages"

    page_type: Mapped[PageType] = mapped_column(
        "pageType", Enum(PageType, name="PageType", create_type=False), unique=True, nullable=False
    )
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[PageStatus] = mapped_column(
        "status", Enum(PageStatus, name="PageStatus", create_type=False), default=PageStatus.DRAFT, nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column("publishedAt", DateTime(timezone=False), default=None)
    scheduled_at: Mapped[datetime | None] = mapped_column("scheduledAt", DateTime(timezone=False), default=None)

    featured_image_id: Mapped[str | None] = mapped_column("featuredImageId", String, ForeignKey("media.id"), default=None)
    seo_id: Mapped[str | None] = mapped_column("seoId", String, ForeignKey("seo_meta.id"), default=None)

    created_by_id: Mapped[str] = mapped_column("createdById", String, ForeignKey("users.id"), nullable=False)
    updated_by_id: Mapped[str] = mapped_column("updatedById", String, ForeignKey("users.id"), nullable=False)

    seo: Mapped["SeoMeta | None"] = relationship()  # noqa: F821
    blocks: Mapped[list["PageBlock"]] = relationship(  # noqa: F821
        back_populates="page", order_by="PageBlock.position", cascade="all, delete-orphan"
    )

    @property
    def featured_image_media_id(self) -> str | None:
        return self.featured_image_id

    @featured_image_media_id.setter
    def featured_image_media_id(self, value: str | None) -> None:
        self.featured_image_id = value

    @property
    def created_by(self) -> str:
        return self.created_by_id

    @created_by.setter
    def created_by(self, value: str) -> None:
        self.created_by_id = value

    @property
    def updated_by(self) -> str:
        return self.updated_by_id

    @updated_by.setter
    def updated_by(self, value: str) -> None:
        self.updated_by_id = value


