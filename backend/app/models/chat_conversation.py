import enum
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class ChatConversationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    OPEN = "open"
    ARCHIVED = "ARCHIVED"


class ChatConversation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "chat_conversations"

    lead_id: Mapped[str | None] = mapped_column("leadId", String, default=None)
    customer_id: Mapped[str | None] = mapped_column("customerId", String, default=None)
    visitor_name: Mapped[str | None] = mapped_column("visitorName", String(120), default=None)
    visitor_email: Mapped[str | None] = mapped_column("visitorEmail", String(255), default=None)
    visitor_phone: Mapped[str | None] = mapped_column("visitorPhone", String(32), default=None)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)
    assigned_user_id: Mapped[str | None] = mapped_column("assignedUserId", String, ForeignKey("users.id"), default=None)
    last_message_at: Mapped[datetime | None] = mapped_column("lastMessageAt", DateTime(timezone=False), default=None)

    assignee: Mapped["User | None"] = relationship()  # noqa: F821
    messages: Mapped[list["ChatMessage"]] = relationship(  # noqa: F821
        back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at"
    )

    @property
    def assigned_to(self) -> str | None:
        return self.assigned_user_id

    @assigned_to.setter
    def assigned_to(self, value: str | None) -> None:
        self.assigned_user_id = value


