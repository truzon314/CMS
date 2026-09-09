import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class AuditLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "audit_logs"

    user_id: Mapped[str | None] = mapped_column("userId", String, ForeignKey("users.id"), default=None)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str | None] = mapped_column("entityType", String(50), default=None)
    entity_id: Mapped[str | None] = mapped_column("entityId", String, default=None, index=True)
    ip_address: Mapped[str | None] = mapped_column("ipAddress", String(64), default=None)
    user_agent: Mapped[str | None] = mapped_column("userAgent", String(500), default=None)
    details: Mapped[dict | None] = mapped_column(JSON, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped["User | None"] = relationship()  # noqa: F821

    @property
    def user_email(self) -> str | None:
        return self.user.email if self.user else None

    @property
    def user_name(self) -> str | None:
        return self.user.full_name if self.user else None

