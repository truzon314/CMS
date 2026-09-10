import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class AuditAction(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    RESTORE = "RESTORE"
    ASSIGN = "ASSIGN"
    UNASSIGN = "UNASSIGN"
    STATUS_CHANGE = "STATUS_CHANGE"
    PERMISSION_CHANGE = "PERMISSION_CHANGE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    EXPORT = "EXPORT"
    IMPORT = "IMPORT"


class EntityTypeForAudit(str, enum.Enum):
    USER = "USER"
    ROLE = "ROLE"
    PERMISSION = "PERMISSION"
    LEAD = "LEAD"
    CUSTOMER = "CUSTOMER"
    PROJECT = "PROJECT"
    PROPERTY = "PROPERTY"
    VILLA = "VILLA"
    PLOT = "PLOT"
    INVENTORY_UNIT = "INVENTORY_UNIT"
    CHANNEL_PARTNER = "CHANNEL_PARTNER"
    ENQUIRY = "ENQUIRY"
    SITE_VISIT = "SITE_VISIT"
    BOOKING = "BOOKING"
    PAYMENT = "PAYMENT"
    AGREEMENT = "AGREEMENT"
    CAMPAIGN = "CAMPAIGN"
    PAGE = "PAGE"
    BLOG = "BLOG"
    MEDIA = "MEDIA"
    SETTING = "SETTING"
    NOTIFICATION = "NOTIFICATION"
    DOCUMENT = "DOCUMENT"


class AuditLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "audit_logs"

    user_id: Mapped[str | None] = mapped_column("userId", String, ForeignKey("users.id"), default=None)
    action: Mapped[str] = mapped_column("action", String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column("entityType", String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column("entityId", String, nullable=False, index=True)
    previous_value: Mapped[dict | None] = mapped_column("previousValue", JSONB, default=None)
    new_value: Mapped[dict | None] = mapped_column("newValue", JSONB, default=None)
    ip_address: Mapped[str | None] = mapped_column("ipAddress", String(64), default=None)
    user_agent: Mapped[str | None] = mapped_column("userAgent", String(500), default=None)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSONB, default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow, index=True)

    user: Mapped["User | None"] = relationship()  # noqa: F821

    @property
    def user_email(self) -> str | None:
        return self.user.email if self.user else None

    @property
    def user_name(self) -> str | None:
        return self.user.full_name if self.user else None

    @property
    def details(self) -> dict | None:
        return self.metadata_json

    @details.setter
    def details(self, value: dict | None) -> None:
        self.metadata_json = value


