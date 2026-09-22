import uuid

from sqlalchemy import Boolean, Integer, String, Text

from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Testimonial(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "testimonials"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_or_location: Mapped[str | None] = mapped_column("designation", String(255), default=None)
    quote: Mapped[str] = mapped_column("content", Text, nullable=False)
    photo_media_id: Mapped[str | None] = mapped_column("mediaId", String(255), default=None)
    rating: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    is_featured: Mapped[bool] = mapped_column("isFeatured", Boolean, default=False)
    is_published: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    sort_order: Mapped[int] = mapped_column("sortOrder", Integer, nullable=False, default=0)
