import uuid

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Testimonial(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "testimonial"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_or_location: Mapped[str | None] = mapped_column(String(255), default=None)
    quote: Mapped[str] = mapped_column(Text, nullable=False)
    photo_media_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), default=None)
    rating: Mapped[int | None] = mapped_column(Integer, default=None)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
