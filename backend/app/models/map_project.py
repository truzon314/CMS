from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class MapProject(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "map_projects"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String, default=None)
    map_provider_type: Mapped[str] = mapped_column("map_provider_type", String(50), default="openstreetmap", nullable=False)
    center_lat: Mapped[float | None] = mapped_column("center_lat", Float, default=None)
    center_lng: Mapped[float | None] = mapped_column("center_lng", Float, default=None)
    zoom_level: Mapped[int] = mapped_column("zoom_level", Integer, default=12)
    bounds: Mapped[dict | None] = mapped_column(JSONB, default=None)
    is_public: Mapped[bool] = mapped_column("is_public", Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column("created_at", DateTime(timezone=False), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column("updated_at", DateTime(timezone=False), default=utcnow, onupdate=utcnow)

    layers: Mapped[list["MapLayer"]] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )
    share_link: Mapped["MapShareLink | None"] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan", uselist=False
    )


