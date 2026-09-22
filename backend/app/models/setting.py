import uuid
from typing import Any

from sqlalchemy import JSON, Boolean, ForeignKey, String

from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Setting(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Generic key-value store (ERD.md) — one row per known setting key
    (`site_name`, `smtp_host`, ...), not one big blob. `SettingsService`
    aggregates all rows into the flat object `GET /settings` returns."""

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[Any] = mapped_column(JSON, nullable=True)
    is_public: Mapped[bool] = mapped_column("isPublic", Boolean, nullable=False, default=True)
    group: Mapped[str] = mapped_column(String(100), nullable=False, default="general")
    description: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    updated_by: Mapped[str | None] = mapped_column("updatedById", String(255), ForeignKey("users.id"), default=None)
