from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class MapProject(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "map_projects"

    project_id: Mapped[str | None] = mapped_column("projectId", String, ForeignKey("projects.id"), default=None)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    map_provider_type: Mapped[str] = mapped_column("mapProviderType", String(50), default="LEAFLET", nullable=False)
    center_lat: Mapped[float | None] = mapped_column("centerLat", Float, default=None)
    center_lng: Mapped[float | None] = mapped_column("centerLng", Float, default=None)
    zoom_level: Mapped[int] = mapped_column("zoomLevel", Integer, default=15)
    bounds: Mapped[dict | None] = mapped_column(JSONB, default=None)
    is_public: Mapped[bool] = mapped_column("isPublic", Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=False), default=utcnow, onupdate=utcnow)

    layers: Mapped[list["MapLayer"]] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )
    share_link: Mapped["MapShareLink | None"] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan", uselist=False
    )

