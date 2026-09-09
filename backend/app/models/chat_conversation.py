import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class ChatConversationStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class ChatConversation(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "chat_conversations"

    status: Mapped[ChatConversationStatus] = mapped_column(
        Enum(ChatConversationStatus, name="ChatConversationStatus", create_type=False),
        default=ChatConversationStatus.OPEN,
        nullable=False,
    )
    has_unread: Mapped[bool] = mapped_column("hasUnread", Boolean, default=True, nullable=False)
    visitor_name: Mapped[str | None] = mapped_column("visitorName", String(120), default=None)
    visitor_email: Mapped[str | None] = mapped_column("visitorEmail", String(255), default=None)
    visitor_phone: Mapped[str | None] = mapped_column("visitorPhone", String(32), default=None)
    assigned_to: Mapped[str | None] = mapped_column("assignedToId", String, ForeignKey("users.id"), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow)
    last_message_at: Mapped[datetime] = mapped_column("lastMessageAt", DateTime(timezone=True), default=utcnow)

    assignee: Mapped["User | None"] = relationship()  # noqa: F821
    messages: Mapped[list["ChatMessage"]] = relationship(  # noqa: F821
        back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at"
    )

