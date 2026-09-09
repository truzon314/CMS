import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class FormSubmissionStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    CLOSED = "closed"


class FormSubmission(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "form_submissions"

    form_key: Mapped[str] = mapped_column("formKey", String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), default=None)
    email: Mapped[str | None] = mapped_column(String(255), default=None)
    property_type_interest: Mapped[str | None] = mapped_column("propertyTypeInterest", String(100), default=None)
    message: Mapped[str | None] = mapped_column(Text, default=None)
    status: Mapped[FormSubmissionStatus] = mapped_column(
        Enum(FormSubmissionStatus, name="FormSubmissionStatus", create_type=False), default=FormSubmissionStatus.NEW, nullable=False
    )
    assigned_to: Mapped[str | None] = mapped_column("assignedToId", String, ForeignKey("users.id"), default=None)
    ip_address: Mapped[str | None] = mapped_column("ipAddress", String(64), default=None)
    submitted_at: Mapped[datetime] = mapped_column("submittedAt", DateTime(timezone=True), default=utcnow)

    assignee: Mapped["User | None"] = relationship()  # noqa: F821

