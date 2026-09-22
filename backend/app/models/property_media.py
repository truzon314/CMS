from datetime import datetime
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class PropertyMedia(UUIDPrimaryKeyMixin, Base):
    """Ordered gallery join (ERD.md's `PROPERTY_MEDIA`) — an association *object*,
    not a plain association table, since `position` is real data, not just a key."""

    __tablename__ = "property_media"

    property_id: Mapped[str] = mapped_column(
        "propertyId", String(255), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    media_id: Mapped[str] = mapped_column("mediaId", String(255), ForeignKey("media.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="GALLERY")
    is_primary: Mapped[bool] = mapped_column("isPrimary", Boolean, nullable=False, default=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=True), default=utcnow
    )

    property: Mapped["Property"] = relationship(back_populates="gallery")  # noqa: F821



