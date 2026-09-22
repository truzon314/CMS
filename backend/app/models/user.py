import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


import enum


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    SUSPENDED = "SUSPENDED"


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column("passwordHash", String(255), nullable=False)
    full_name: Mapped[str] = mapped_column("fullName", String(255), nullable=False)
    role_id: Mapped[str] = mapped_column("roleId", String(255), ForeignKey("roles.id"), nullable=False)

    # No FK constraint yet — the `media` table doesn't exist until Phase 3.
    # Add the ForeignKey("media.id") in a Phase 3 migration once it does.
    avatar_media_id: Mapped[str | None] = mapped_column("avatarUrl", String(255), default=None)

    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="UserStatus", create_type=False), default=UserStatus.ACTIVE, nullable=False
    )
    is_email_verified: Mapped[bool] = mapped_column("emailVerified", Boolean, default=False)

    @property
    def is_active(self) -> bool:
        return str(self.status).upper() == "ACTIVE" or getattr(self.status, "value", "") == "ACTIVE"

    # 2FA columns exist per ERD.md; the flow itself is deferred (ROADMAP.md Phase 8+).
    two_factor_enabled: Mapped[bool] = mapped_column("twoFactorEnabled", Boolean, default=False)
    two_factor_secret: Mapped[str | None] = mapped_column("twoFactorSecret", String(255), default=None)

    last_login_at: Mapped[datetime | None] = mapped_column("lastLoginAt", DateTime(timezone=True), default=None)

    role: Mapped["Role"] = relationship(back_populates="users")  # noqa: F821
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def is_active(self) -> bool:
        return self.status == UserStatus.ACTIVE

    @is_active.setter
    def is_active(self, value: bool) -> None:
        if value:
            self.status = UserStatus.ACTIVE
        else:
            self.status = UserStatus.INACTIVE

    @property
    def is_email_verified(self) -> bool:
        return self.email_verified

    @is_email_verified.setter
    def is_email_verified(self, value: bool) -> None:
        self.email_verified = value


