import enum
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, ForeignKey, Text

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class ChatMessageSender(str, enum.Enum):
    VISITOR = "VISITOR"
    ADMIN = "ADMIN"
    AUTO = "AUTO"


class ChatMessage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "chat_messages"

    conversation_id: Mapped[str] = mapped_column(
        "conversationId", String(255), ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender: Mapped[str] = mapped_column(
        "senderType", String(50), nullable=False, default="visitor"
    )

    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow, index=True)

    conversation: Mapped["ChatConversation"] = relationship(back_populates="messages")
    sender_user: Mapped["User | None"] = relationship()  # noqa: F821

    @property
    def sender(self) -> str:
        return self.sender_type

    @sender.setter
    def sender(self, value: str) -> None:
        self.sender_type = str(value)


