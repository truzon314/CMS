import uuid

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class GalleryItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "gallery_item"

    # Bare column, no FK constraint — same convention as
    # BlogPost.featured_image_media_id (media lives in its own domain).
    media_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(255), default=None)
    category: Mapped[str | None] = mapped_column(String(100), default=None)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
