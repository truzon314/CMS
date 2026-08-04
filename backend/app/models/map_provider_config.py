from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MapProviderConfig(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "map_provider_config"

    provider_type: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    api_key: Mapped[str | None] = mapped_column(String(500), default=None)
    tile_url: Mapped[str | None] = mapped_column(String(500), default=None)
    style_url: Mapped[str | None] = mapped_column(String(500), default=None)
    attribution: Mapped[str | None] = mapped_column(String(500), default=None)
    options: Mapped[dict | None] = mapped_column(JSON, default=None)
