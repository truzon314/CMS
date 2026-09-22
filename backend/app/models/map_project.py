from datetime import datetime
from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class MapProject(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "map_projects"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    map_provider_type: Mapped[str] = mapped_column(String(20), default="google", nullable=False)
    center_lat: Mapped[float | None] = mapped_column(default=None)
    center_lng: Mapped[float | None] = mapped_column(default=None)
    zoom_level: Mapped[int] = mapped_column(default=12)
    bounds: Mapped[dict | None] = mapped_column(JSON, default=None)
    is_public: Mapped[bool] = mapped_column(default=False)
    # Bounding box used to filter stray features from GeoJSON layers at serve time.
    # Format: {"min_lat": float, "max_lat": float, "min_lng": float, "max_lng": float}
    # Set automatically when layers are uploaded; features outside this box are dropped.
    geojson_filter_bounds: Mapped[dict | None] = mapped_column(JSON, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    layers: Mapped[list["MapLayer"]] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )
    share_link: Mapped["MapShareLink | None"] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan", uselist=False
    )
