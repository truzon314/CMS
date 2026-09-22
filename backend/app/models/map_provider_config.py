from datetime import datetime
from sqlalchemy import JSON, Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class MapProviderConfig(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "map_provider_configs"

    provider_type: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    api_key: Mapped[str | None] = mapped_column(String(500), default=None, nullable=True)
    tile_url: Mapped[str | None] = mapped_column("custom_tile_url", String(500), default=None, nullable=True)
    max_zoom: Mapped[int] = mapped_column(Integer, default=22, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    @property
    def style_url(self) -> str | None:
        return None

    @property
    def attribution(self) -> str | None:
        return None

    @property
    def options(self) -> dict | None:
        return None
