import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class AuditLog(UUIDPrimaryKeyMixin, Base):
    """Append-only — no updated_at, no soft-delete (ERD.md's audit trail is
    immutable by design). `action`/`entity_type` are free-form strings, not
    enums: this table spans every module (auth, users, pages, blog,
    properties, media, menus, forms, settings) and a strict enum would need
    editing every time any service gains a new mutating action."""

    __tablename__ = "audit_logs"

    user_id: Mapped[str | None] = mapped_column("userId", String(255), ForeignKey("users.id"), default=None)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str | None] = mapped_column("entityType", String(50), default=None)
    entity_id: Mapped[str | None] = mapped_column("entityId", String(255), default=None, index=True)
    ip_address: Mapped[str | None] = mapped_column("ipAddress", String(64), default=None)
    user_agent: Mapped[str | None] = mapped_column("userAgent", String(500), default=None)
    details: Mapped[dict | None] = mapped_column("metadata", JSON, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped["User | None"] = relationship()  # noqa: F821

    @property
    def user_email(self) -> str | None:
        """Lets `AuditLogRead.model_validate(entry)` (from_attributes) pick
        this up via plain getattr, same pattern as `BlogPost.author_name`."""
        return self.user.email if self.user else None

    @property
    def user_name(self) -> str | None:
        return self.user.full_name if self.user else None
