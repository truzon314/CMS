from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class MapProviderConfig(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "map_provider_configs"

    provider_type: Mapped[str] = mapped_column("provider_type", String(50), unique=True, nullable=False)
    api_key: Mapped[str | None] = mapped_column("api_key", String(500), default=None)
    custom_tile_url: Mapped[str | None] = mapped_column("custom_tile_url", String(500), default=None)
    max_zoom: Mapped[int] = mapped_column("max_zoom", Integer, default=19)
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column("created_at", DateTime(timezone=False), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column("updated_at", DateTime(timezone=False), default=utcnow, onupdate=utcnow)

    @property
    def tile_url(self) -> str | None:
        return self.custom_tile_url

    @tile_url.setter
    def tile_url(self, value: str | None) -> None:
        self.custom_tile_url = value


