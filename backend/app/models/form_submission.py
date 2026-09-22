import enum
from typing import Any

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class FormSubmissionStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    CLOSED = "CLOSED"


class FormSubmission(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "form_submissions"

    __tablename__ = "form_submissions"

    form_key: Mapped[str] = mapped_column("formKey", String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), default=None)
    property_type_interest: Mapped[str | None] = mapped_column("propertyType", String(100), default=None)
    message: Mapped[str | None] = mapped_column(Text, default=None)
    status: Mapped[str] = mapped_column(String(50), default="NEW", nullable=False)
    assigned_to: Mapped[str | None] = mapped_column("assignedUserId", String(255), ForeignKey("users.id"), default=None)
    ip_address: Mapped[str | None] = mapped_column("ipAddress", String(64), default=None)
    submitted_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    assignee: Mapped["User | None"] = relationship()  # noqa: F821

    @property
    def property_type_interest(self) -> str | None:
        return self.property_type

    @property_type_interest.setter
    def property_type_interest(self, value: str | None) -> None:
        self.property_type = value

    @property
    def assigned_to(self) -> str | None:
        return self.assigned_user_id

    @assigned_to.setter
    def assigned_to(self, value: str | None) -> None:
        self.assigned_user_id = value

    @property
    def submitted_at(self):
        return self.created_at


