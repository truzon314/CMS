from typing import Any

from sqlalchemy import JSON, Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Setting(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Generic key-value store targeting production `settings` table."""

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[Any] = mapped_column(JSON, nullable=True)
    description: Mapped[str | None] = mapped_column(String, default=None)
    is_public: Mapped[bool] = mapped_column("isPublic", Boolean, default=False)
    group: Mapped[str] = mapped_column(String(50), default="general")
    updated_by: Mapped[str | None] = mapped_column("updatedById", String, ForeignKey("users.id"), default=None)

