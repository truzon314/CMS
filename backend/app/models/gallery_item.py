import uuid

from sqlalchemy import Boolean, Integer, String

from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class GalleryItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "gallery_items"

    # Bare column, no FK constraint — same convention as
    # BlogPost.featured_image_media_id (media lives in its own domain).
    media_id: Mapped[str] = mapped_column("mediaId", String(255), nullable=False)
    caption: Mapped[str | None] = mapped_column("description", String(255), default=None)
    category: Mapped[str | None] = mapped_column(String(100), default=None)
    sort_order: Mapped[int] = mapped_column("position", Integer, default=0)
    is_published: Mapped[bool] = mapped_column("isActive", Boolean, default=False)
