import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


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
    """created_at / updated_at on every table, per ERD.md."""

    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class SoftDeleteMixin:
    """Soft-delete for User/BlogPost/Property/Media/MenuItem — Trash is a query, not a table."""

    deleted_at: Mapped[datetime | None] = mapped_column("deletedAt", DateTime(timezone=True), default=None)