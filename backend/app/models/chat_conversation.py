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
    """A single visitor's chat session (CRM) — the live-chat widget collects
    name/phone (required) and email (optional) via a pre-chat form before the
    first message, so `has_unread` flips true on every new visitor message and
    clears when an admin opens the thread (ConversationThreadDrawer.tsx)."""

    __tablename__ = "chat_conversation"

    status: Mapped[ChatConversationStatus] = mapped_column(
        Enum(ChatConversationStatus, name="chat_conversation_status"),
        default=ChatConversationStatus.OPEN,
        nullable=False,
    )
    has_unread: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    visitor_name: Mapped[str | None] = mapped_column(String(120), default=None)
    visitor_email: Mapped[str | None] = mapped_column(String(255), default=None)
    visitor_phone: Mapped[str | None] = mapped_column(String(32), default=None)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_message_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    assignee: Mapped["User | None"] = relationship()  # noqa: F821
    messages: Mapped[list["ChatMessage"]] = relationship(  # noqa: F821
        back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at"
    )
