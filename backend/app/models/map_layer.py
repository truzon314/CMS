from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class MapLayer(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "map_layers"

    map_project_id: Mapped[str] = mapped_column(
        "mapProjectId", String, ForeignKey("map_projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    layer_type: Mapped[str] = mapped_column("type", String(50), nullable=False, default="feature")
    geojson: Mapped[dict | None] = mapped_column(JSONB, default=None)
    stroke_color: Mapped[str] = mapped_column("strokeColor", String(20), default="#3388ff", nullable=False)
    fill_color: Mapped[str] = mapped_column("fillColor", String(20), default="#3388ff", nullable=False)
    fill_opacity: Mapped[float] = mapped_column("fillOpacity", Float, default=0.4, nullable=False)
    stroke_weight: Mapped[int] = mapped_column("strokeWeight", Integer, default=2, nullable=False)
    stroke_style: Mapped[str] = mapped_column("strokeStyle", String(10), default="solid", nullable=False)
    default_visible: Mapped[bool] = mapped_column("defaultVisible", Boolean, default=True, nullable=False)
    min_zoom: Mapped[int | None] = mapped_column("minZoom", Integer, default=None)
    max_zoom: Mapped[int | None] = mapped_column("maxZoom", Integer, default=None)
    color_rules: Mapped[dict | None] = mapped_column("colorRules", JSONB, default=None)
    label_property: Mapped[str | None] = mapped_column("labelProperty", String(255), default=None)
    label_alignment: Mapped[str | None] = mapped_column("labelAlignment", String(10), default="center")
    popup_enabled: Mapped[bool] = mapped_column("popupEnabled", Boolean, default=True, nullable=False)
    popup_properties: Mapped[list[str] | None] = mapped_column("popupProperties", ARRAY(String), default=None)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=False), default=utcnow, onupdate=utcnow)

    project: Mapped["MapProject"] = relationship(back_populates="layers")  # noqa: F821
