from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column("passwordHash", String(255), nullable=False)
    full_name: Mapped[str] = mapped_column("fullName", String(255), nullable=False)
    role_id: Mapped[str] = mapped_column("roleId", String, ForeignKey("roles.id"), nullable=False)

    avatar_media_id: Mapped[str | None] = mapped_column("avatarMediaId", String, default=None)

    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    is_email_verified: Mapped[bool] = mapped_column("isEmailVerified", Boolean, default=False)

    two_factor_enabled: Mapped[bool] = mapped_column("twoFactorEnabled", Boolean, default=False)
    two_factor_secret: Mapped[str | None] = mapped_column("twoFactorSecret", String(255), default=None)

    last_login_at: Mapped[datetime | None] = mapped_column("lastLoginAt", DateTime(timezone=True), default=None)

    role: Mapped["Role"] = relationship(back_populates="users")  # noqa: F821
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )

