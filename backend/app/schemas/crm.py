import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.chat_conversation import ChatConversationStatus
from app.models.chat_message import ChatMessageSender


class ChatMessageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    conversation_id: uuid.UUID | None = None
    body: str = Field(min_length=1, max_length=4000)
    # Only required (enforced in CrmService) when conversation_id is None —
    # the widget's pre-chat form collects these once, on the first message.
    visitor_name: str | None = Field(default=None, max_length=120)
    visitor_email: str | None = Field(default=None, max_length=255)
    visitor_phone: str | None = Field(default=None, max_length=32)


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    sender: ChatMessageSender
    body: str
    created_at: datetime


class ChatConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: ChatConversationStatus
    has_unread: bool
    assigned_to: uuid.UUID | None
    visitor_name: str | None
    visitor_email: str | None
    visitor_phone: str | None
    created_at: datetime
    last_message_at: datetime


class ChatConversationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: ChatConversationStatus | None = None
    assigned_to: uuid.UUID | None = None


class AdminReplyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    body: str = Field(min_length=1, max_length=4000)


class AutoReplyConfigRead(BaseModel):
    enabled: bool
    message: str


class AutoReplyConfigUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enabled: bool
    message: str = Field(min_length=1, max_length=1000)
