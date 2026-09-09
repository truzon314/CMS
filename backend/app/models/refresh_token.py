import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class RefreshToken(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column("tokenHash", String(255), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column("expiresAt", DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column("revokedAt", DateTime(timezone=True), default=None)
    ip_address: Mapped[str | None] = mapped_column("ipAddress", String(64), default=None)
    user_agent: Mapped[str | None] = mapped_column("userAgent", String(255), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")  # noqa: F821

