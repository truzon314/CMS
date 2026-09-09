from sqlalchemy import JSON, Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MapLayer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "map_layers"

    project_id: Mapped[str] = mapped_column(
        "projectId", String, ForeignKey("map_projects.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    stroke_color: Mapped[str] = mapped_column("strokeColor", String(20), default="#2563eb", nullable=False)
    fill_color: Mapped[str] = mapped_column("fillColor", String(20), default="#2563eb", nullable=False)
    fill_opacity: Mapped[float] = mapped_column("fillOpacity", Float, default=0.4, nullable=False)
    stroke_weight: Mapped[int] = mapped_column("strokeWeight", Integer, default=2, nullable=False)
    default_visible: Mapped[bool] = mapped_column("defaultVisible", Boolean, default=True, nullable=False)
    color_rules: Mapped[list | None] = mapped_column("colorRules", JSON, default=None)
    label_property: Mapped[str | None] = mapped_column("labelProperty", String(255), default=None)
    label_alignment: Mapped[str | None] = mapped_column("labelAlignment", String(10), default=None)
    popup_enabled: Mapped[bool] = mapped_column("popupEnabled", Boolean, default=True, nullable=False)
    popup_properties: Mapped[list | None] = mapped_column("popupProperties", JSON, default=None)
    stroke_style: Mapped[str] = mapped_column("strokeStyle", String(10), default="solid", nullable=False)
    geojson: Mapped[dict | None] = mapped_column(JSON, default=None)

    project: Mapped["MapProject"] = relationship(back_populates="layers")  # noqa: F821

