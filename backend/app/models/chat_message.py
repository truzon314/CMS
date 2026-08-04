import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class ChatMessageSender(str, enum.Enum):
    VISITOR = "visitor"
    ADMIN = "admin"
    AUTO = "auto"


class ChatMessage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "chat_message"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_conversation.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender: Mapped[ChatMessageSender] = mapped_column(
        Enum(ChatMessageSender, name="chat_message_sender"), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    conversation: Mapped["ChatConversation"] = relationship(back_populates="messages")
