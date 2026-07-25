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
    """Populated by the public site's form endpoints (`POST /public/forms/{key}`,
    ROADMAP.md Phase 7) — not built yet, so Phase 5 seeds a few sample rows to
    prove this module's list/detail UI before that submission path exists."""

    __tablename__ = "form_submission"

    form_key: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), default=None)
    email: Mapped[str | None] = mapped_column(String(255), default=None)
    property_type_interest: Mapped[str | None] = mapped_column(String(100), default=None)
    message: Mapped[str | None] = mapped_column(Text, default=None)
    status: Mapped[FormSubmissionStatus] = mapped_column(
        Enum(FormSubmissionStatus, name="form_submission_status"), default=FormSubmissionStatus.NEW, nullable=False
    )
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), default=None)
    ip_address: Mapped[str | None] = mapped_column(String(64), default=None)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    assignee: Mapped["User | None"] = relationship()  # noqa: F821
