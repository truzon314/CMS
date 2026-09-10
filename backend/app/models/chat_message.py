import enum
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class ChatMessageSender(str, enum.Enum):
    VISITOR = "VISITOR"
    ADMIN = "ADMIN"
    AUTO = "AUTO"


class ChatMessage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "chat_messages"

    conversation_id: Mapped[str] = mapped_column(
        "conversationId", String, ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_id: Mapped[str | None] = mapped_column("senderId", String, ForeignKey("users.id"), default=None)
    sender_type: Mapped[str] = mapped_column("senderType", String(50), nullable=False, default="VISITOR")
    sender_name: Mapped[str | None] = mapped_column("senderName", String(120), default=None)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column("messageType", String(50), default="TEXT")
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSONB, default=None)
    read_at: Mapped[datetime | None] = mapped_column("readAt", DateTime(timezone=False), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow, index=True)

    conversation: Mapped["ChatConversation"] = relationship(back_populates="messages")
    sender_user: Mapped["User | None"] = relationship()  # noqa: F821

    @property
    def sender(self) -> str:
        return self.sender_type

    @sender.setter
    def sender(self, value: str) -> None:
        self.sender_type = str(value)


