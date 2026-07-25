import uuid

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin


class PropertyMedia(UUIDPrimaryKeyMixin, Base):
    """Ordered gallery join (ERD.md's `PROPERTY_MEDIA`) — an association *object*,
    not a plain association table, since `position` is real data, not just a key."""

    __tablename__ = "property_media"

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("property.id", ondelete="CASCADE"), nullable=False
    )
    media_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("media.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    property: Mapped["Property"] = relationship(back_populates="gallery")  # noqa: F821
