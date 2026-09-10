from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class PropertyMedia(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "property_media"

    property_id: Mapped[str] = mapped_column(
        "propertyId", String, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    media_id: Mapped[str] = mapped_column("mediaId", String, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="GALLERY")
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_primary: Mapped[bool] = mapped_column("isPrimary", Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow)

    property: Mapped["Property"] = relationship(back_populates="gallery")  # noqa: F821
