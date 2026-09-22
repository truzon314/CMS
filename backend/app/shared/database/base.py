import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def generate_uuid_str() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    """Shared declarative base for every ORM model in the app."""


class UUIDPrimaryKeyMixin:
    """Every table uses a string UUID primary key, matching DB schema."""

    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=generate_uuid_str
    )


class TimestampMixin:
    """Maps `created_at` and `updated_at` to production `createdAt` and `updatedAt` columns."""

    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class SoftDeleteMixin:
    """Maps `deleted_at` to production `deletedAt` column."""

    deleted_at: Mapped[datetime | None] = mapped_column("deletedAt", DateTime(timezone=False), default=None)

    deleted_at: Mapped[datetime | None] = mapped_column("deletedAt", DateTime(timezone=True), default=None)