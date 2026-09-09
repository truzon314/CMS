import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class AuthTokenPurpose(str, enum.Enum):
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"


class AuthToken(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "auth_tokens"

    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    purpose: Mapped[AuthTokenPurpose] = mapped_column(
        Enum(AuthTokenPurpose, name="AuthTokenPurpose", create_type=False), nullable=False
    )
    token_hash: Mapped[str] = mapped_column("tokenHash", String(255), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column("expiresAt", DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column("usedAt", DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship()  # noqa: F821

