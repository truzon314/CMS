import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class RefreshToken(UUIDPrimaryKeyMixin, Base):
    """Only a hash is stored — a DB leak alone doesn't yield a usable credential
    (SECURITY_CHECKLIST.md §1). Rotated on every /auth/refresh call; reusing an
    already-rotated token should revoke the whole family (checked in AuthService).
    """

    __tablename__ = "refresh_tokens"

    user_id: Mapped[str] = mapped_column(
        "userId", String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column("token", String(255), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column("expiresAt", DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column("revokedAt", DateTime(timezone=True), default=None)
    ip_address: Mapped[str | None] = mapped_column("ipAddress", String(64), default=None)
    user_agent: Mapped[str | None] = mapped_column("userAgent", String(255), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")  # noqa: F821
