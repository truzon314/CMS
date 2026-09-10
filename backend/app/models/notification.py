import enum
from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class NotificationType(str, enum.Enum):
    LEAD_ASSIGNED = "LEAD_ASSIGNED"
    LEAD_STATUS_CHANGED = "LEAD_STATUS_CHANGED"
    FOLLOW_UP_REMINDER = "FOLLOW_UP_REMINDER"
    SITE_VISIT_REMINDER = "SITE_VISIT_REMINDER"
    SITE_VISIT_SCHEDULED = "SITE_VISIT_SCHEDULED"
    BOOKING_UPDATE = "BOOKING_UPDATE"
    PAYMENT_UPDATE = "PAYMENT_UPDATE"
    NEW_PROPERTY = "NEW_PROPERTY"
    NEW_PROJECT = "NEW_PROJECT"
    ADMIN_ANNOUNCEMENT = "ADMIN_ANNOUNCEMENT"
    SYSTEM_ALERT = "SYSTEM_ALERT"
    COMMISSION_UPDATE = "COMMISSION_UPDATE"
    DOCUMENT_REQUEST = "DOCUMENT_REQUEST"
    TASK_ASSIGNED = "TASK_ASSIGNED"


class NotificationChannel(str, enum.Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    SMS = "SMS"
    WHATSAPP = "WHATSAPP"
    PUSH = "PUSH"


class Notification(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column("userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[NotificationType] = mapped_column(
        "type", Enum(NotificationType, name="NotificationType", create_type=False), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(String(1000), nullable=False)
    data: Mapped[dict | None] = mapped_column(JSONB, default=None)
    channels: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=list)
    is_read: Mapped[bool] = mapped_column("isRead", Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column("readAt", DateTime(timezone=False), default=None)
    priority: Mapped[str] = mapped_column(String(20), default="NORMAL")
    action_url: Mapped[str | None] = mapped_column("actionUrl", String(500), default=None)
    action_label: Mapped[str | None] = mapped_column("actionLabel", String(100), default=None)
    expires_at: Mapped[datetime | None] = mapped_column("expiresAt", DateTime(timezone=False), default=None)
    sent_at: Mapped[datetime | None] = mapped_column("sentAt", DateTime(timezone=False), default=None)
    delivered_at: Mapped[datetime | None] = mapped_column("deliveredAt", DateTime(timezone=False), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow, index=True)

    user: Mapped["User"] = relationship()  # noqa: F821

    @property
    def link(self) -> str | None:
        return self.action_url

    @link.setter
    def link(self, value: str | None) -> None:
        self.action_url = value


