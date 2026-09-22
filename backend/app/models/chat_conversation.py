import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.orm.attributes import instance_state

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class ChatConversationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    OPEN = "open"
    ARCHIVED = "ARCHIVED"


class ChatConversation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "chat_conversations"

    __tablename__ = "chat_conversations"

    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False)
    lead_id: Mapped[str | None] = mapped_column("leadId", String(255), default=None)
    customer_id: Mapped[str | None] = mapped_column("customerId", String(255), default=None)
    visitor_name: Mapped[str | None] = mapped_column("visitorName", String(120), default=None)
    visitor_email: Mapped[str | None] = mapped_column("visitorEmail", String(255), default=None)
    visitor_phone: Mapped[str | None] = mapped_column("visitorPhone", String(32), default=None)
    assigned_to: Mapped[str | None] = mapped_column("assignedUserId", String(255), ForeignKey("users.id"), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    last_message_at: Mapped[datetime | None] = mapped_column("lastMessageAt", DateTime(timezone=True), default=utcnow)

    _has_unread: bool = False

    @property
    def has_unread(self) -> bool:
        return getattr(self, "_has_unread", False)

    @has_unread.setter
    def has_unread(self, value: bool) -> None:
        self._has_unread = bool(value)

    @property
    def last_message_preview(self) -> str | None:
        try:
            state = instance_state(self)
            if "messages" not in state.unloaded and self.messages:
                return self.messages[-1].body
        except Exception:
            pass
        return None

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


