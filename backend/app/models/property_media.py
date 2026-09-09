import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin


class PropertyMedia(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "property_medias"

    property_id: Mapped[str] = mapped_column(
        "propertyId", String, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    media_id: Mapped[str] = mapped_column("mediaId", String, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="gallery")
    position: Mapped[int] = mapped_column(Integer, default=0)

    property: Mapped["Property"] = relationship(back_populates="gallery")  # noqa: F821
