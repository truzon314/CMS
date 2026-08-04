import uuid

from sqlalchemy import JSON, Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MapLayer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "map_layer"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("map_project.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    stroke_color: Mapped[str] = mapped_column(String(20), default="#2563eb", nullable=False)
    fill_color: Mapped[str] = mapped_column(String(20), default="#2563eb", nullable=False)
    fill_opacity: Mapped[float] = mapped_column(Float, default=0.4, nullable=False)
    stroke_weight: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    default_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Each item: {id, property, value, action: "color"|"hide", color?, opacity?}
    color_rules: Mapped[list | None] = mapped_column(JSON, default=None)
    label_property: Mapped[str | None] = mapped_column(String(255), default=None)
    popup_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    popup_properties: Mapped[list | None] = mapped_column(JSON, default=None)
    stroke_style: Mapped[str] = mapped_column(String(10), default="solid", nullable=False)
    # The whole GeoJSON FeatureCollection for this layer — one JSON blob, not
    # a per-feature table, so there is exactly one place a feature edit can
    # land (no admin-canvas-vs-public-read drift like the old flat-file +
    # geojson_features-table split this replaces).
    geojson: Mapped[dict | None] = mapped_column(JSON, default=None)

    project: Mapped["MapProject"] = relationship(back_populates="layers")  # noqa: F821
