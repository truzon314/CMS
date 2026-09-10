import enum
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class AuthTokenPurpose(str, enum.Enum):
    PASSWORD_RESET = "PASSWORD_RESET"
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
    PHONE_VERIFICATION = "PHONE_VERIFICATION"


class AuthToken(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "auth_tokens"

    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    purpose: Mapped[str] = mapped_column("purpose", String(100), nullable=False)
    token: Mapped[str] = mapped_column("token", String(255), nullable=False, unique=True, index=True)
    token_hash = synonym("token")
    expires_at: Mapped[datetime] = mapped_column("expiresAt", DateTime(timezone=False), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column("usedAt", DateTime(timezone=False), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow)

    user: Mapped["User"] = relationship()  # noqa: F821


