import uuid
from datetime import datetime
from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class MapLayer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "map_layers"

    project_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("map_projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    stroke_color: Mapped[str] = mapped_column(String(20), default="#2563eb", nullable=False)
    fill_color: Mapped[str] = mapped_column(String(20), default="#2563eb", nullable=False)
    fill_opacity: Mapped[float] = mapped_column(Float, default=0.4, nullable=False)
    stroke_weight: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    default_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    color_rules: Mapped[dict | None] = mapped_column(JSON, default=None)
    label_property: Mapped[str | None] = mapped_column(String(255), default=None)
    label_alignment: Mapped[str | None] = mapped_column(String(50), default=None)
    popup_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    popup_properties: Mapped[dict | None] = mapped_column(JSON, default=None)
    stroke_style: Mapped[str] = mapped_column(String(10), default="solid", nullable=False)
    
    geojson: Mapped[dict | None] = mapped_column(JSON, default=None)
    
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    project: Mapped["MapProject"] = relationship(back_populates="layers")  # noqa: F821
