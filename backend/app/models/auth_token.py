import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class AuthTokenPurpose(str, enum.Enum):
    PASSWORD_RESET = "PASSWORD_RESET"
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
    PHONE_VERIFICATION = "PHONE_VERIFICATION"


class AuthToken(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "auth_tokens"

    __tablename__ = "auth_tokens"

    user_id: Mapped[str] = mapped_column(
        "userId", String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    purpose: Mapped[AuthTokenPurpose] = mapped_column(Enum(AuthTokenPurpose, name="auth_token_purpose"), nullable=False)
    token_hash: Mapped[str] = mapped_column("token", String(255), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column("expiresAt", DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column("usedAt", DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship()  # noqa: F821


