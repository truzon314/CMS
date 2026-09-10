from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class MapLayer(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "map_layers"

    project_id: Mapped[str] = mapped_column(
        "project_id", String, ForeignKey("map_projects.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    geojson: Mapped[dict | None] = mapped_column(JSONB, default=None)
    stroke_color: Mapped[str] = mapped_column("stroke_color", String(20), default="#3388ff", nullable=False)
    fill_color: Mapped[str] = mapped_column("fill_color", String(20), default="#3388ff", nullable=False)
    fill_opacity: Mapped[float] = mapped_column("fill_opacity", Float, default=0.4, nullable=False)
    stroke_weight: Mapped[int] = mapped_column("stroke_weight", Integer, default=2, nullable=False)
    stroke_style: Mapped[str] = mapped_column("stroke_style", String(10), default="solid", nullable=False)
    default_visible: Mapped[bool] = mapped_column("default_visible", Boolean, default=True, nullable=False)
    color_rules: Mapped[list | None] = mapped_column("color_rules", JSONB, default=None)
    label_property: Mapped[str | None] = mapped_column("label_property", String(255), default=None)
    label_alignment: Mapped[str | None] = mapped_column("label_alignment", String(10), default="center")
    popup_enabled: Mapped[bool] = mapped_column("popup_enabled", Boolean, default=True, nullable=False)
    popup_properties: Mapped[list | None] = mapped_column("popup_properties", JSONB, default=None)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column("created_at", DateTime(timezone=False), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column("updated_at", DateTime(timezone=False), default=utcnow, onupdate=utcnow)

    project: Mapped["MapProject"] = relationship(back_populates="layers")  # noqa: F821


