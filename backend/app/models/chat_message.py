import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class ChatMessageSender(str, enum.Enum):
    VISITOR = "visitor"
    ADMIN = "admin"
    AUTO = "auto"


class ChatMessage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "chat_messages"

    conversation_id: Mapped[str] = mapped_column(
        "conversationId", String, ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender: Mapped[ChatMessageSender] = mapped_column(
        Enum(ChatMessageSender, name="ChatMessageSender", create_type=False), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow, index=True)

    conversation: Mapped["ChatConversation"] = relationship(back_populates="messages")

