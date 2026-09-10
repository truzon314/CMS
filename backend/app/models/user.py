import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    SUSPENDED = "SUSPENDED"


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(32), unique=True, default=None, index=True)
    password_hash: Mapped[str] = mapped_column("passwordHash", String(255), nullable=False)
    full_name: Mapped[str] = mapped_column("fullName", String(255), nullable=False)
    role_id: Mapped[str] = mapped_column("roleId", String, ForeignKey("roles.id"), nullable=False)

    avatar_url: Mapped[str | None] = mapped_column("avatarUrl", String, default=None)

    status: Mapped[UserStatus] = mapped_column(
        "status",
        Enum(UserStatus, name="UserStatus", create_type=False),
        default=UserStatus.PENDING_VERIFICATION,
        nullable=False,
    )

    email_verified: Mapped[bool] = mapped_column("emailVerified", Boolean, default=False)
    phone_verified: Mapped[bool] = mapped_column("phoneVerified", Boolean, default=False)

    two_factor_enabled: Mapped[bool] = mapped_column("twoFactorEnabled", Boolean, default=False)
    two_factor_secret: Mapped[str | None] = mapped_column("twoFactorSecret", String(255), default=None)
    failed_login_attempts: Mapped[int] = mapped_column("failedLoginAttempts", Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column("lockedUntil", DateTime(timezone=False), default=None)

    last_login_at: Mapped[datetime | None] = mapped_column("lastLoginAt", DateTime(timezone=False), default=None)

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


