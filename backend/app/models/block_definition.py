from typing import Any

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class BlockDefinition(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "block_definitions"

    key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String, default=None)
    category: Mapped[str] = mapped_column(String(50), default="LAYOUT")
    schema: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    default_config: Mapped[dict | None] = mapped_column("defaultConfig", JSONB, default=None)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    sort_order: Mapped[int] = mapped_column("sortOrder", Integer, default=0)
