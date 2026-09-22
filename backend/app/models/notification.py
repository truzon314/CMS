import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class Notification(UUIDPrimaryKeyMixin, Base):
    """In-app notifications (ERD.md) — one row per recipient, not a shared
    row with a read-receipts join table, since volume is low and this keeps
    the unread-count query a single indexed WHERE clause."""

    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column("userId", String(255), ForeignKey("users.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str | None] = mapped_column(String(1000), default=None)
    link: Mapped[str | None] = mapped_column("actionUrl", String(500), default=None)
    is_read: Mapped[bool] = mapped_column("isRead", Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped["User"] = relationship()  # noqa: F821
