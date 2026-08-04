import uuid

from app.domain.repositories.crm_repository import CrmRepository
from app.domain.repositories.settings_repository import SettingsRepository
from app.domain.repositories.user_repository import UserRepository
from app.models.chat_conversation import ChatConversation
from app.models.chat_message import ChatMessage, ChatMessageSender
from app.schemas.crm import ChatConversationUpdate
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.shared.database.base import utcnow
from app.shared.exceptions.exceptions import NotFoundError, ValidationAppError

AUTO_REPLY_ENABLED_KEY = "crm_auto_reply_enabled"
AUTO_REPLY_MESSAGE_KEY = "crm_auto_reply_message"
DEFAULT_AUTO_REPLY_MESSAGE = "Hi there! How can we help with your property search today?"


class CrmService:
    def __init__(
        self,
        crm: CrmRepository,
        settings: SettingsRepository,
        users: UserRepository,
        audit: AuditService,
        notifications: NotificationService,
    ):
        self.crm = crm
        self.settings = settings
        self.users = users
        self.audit = audit
        self.notifications = notifications

    # -- auto-reply config (stored as two generic Setting rows, not a new table) --

    async def get_auto_reply_config(self) -> tuple[bool, str]:
        rows = await self.settings.get_all()
        values = {row.key: row.value for row in rows}
        enabled = values.get(AUTO_REPLY_ENABLED_KEY)
        message = values.get(AUTO_REPLY_MESSAGE_KEY)
        return (
            True if enabled is None else bool(enabled),
            str(message) if message else DEFAULT_AUTO_REPLY_MESSAGE,
        )

    async def update_auto_reply_config(self, enabled: bool, message: str, updated_by: uuid.UUID) -> tuple[bool, str]:
        await self.settings.upsert(AUTO_REPLY_ENABLED_KEY, enabled, updated_by)
        await self.settings.upsert(AUTO_REPLY_MESSAGE_KEY, message, updated_by)
        return enabled, message

    # -- visitor-facing (public, unauthenticated) --

    async def post_visitor_message(
        self,
        conversation_id: uuid.UUID | None,
        body: str,
        visitor_name: str | None = None,
        visitor_email: str | None = None,
        visitor_phone: str | None = None,
    ) -> tuple[ChatConversation, list[ChatMessage]]:
        is_new = conversation_id is None
        if is_new:
            if not visitor_name or not visitor_phone:
                raise ValidationAppError("Name and phone number are required to start a chat.")
            conversation = await self.crm.create_conversation(
                ChatConversation(
                    visitor_name=visitor_name.strip(),
                    visitor_email=visitor_email.strip() if visitor_email else None,
                    visitor_phone=visitor_phone.strip(),
                )
            )
        else:
            conversation = await self.crm.get_conversation(conversation_id)
            if conversation is None:
                raise NotFoundError("Conversation not found.")

        await self.crm.add_message(
            ChatMessage(conversation_id=conversation.id, sender=ChatMessageSender.VISITOR, body=body)
        )
        conversation.has_unread = True
        conversation.last_message_at = utcnow()
        await self.crm.update_conversation(conversation)

        if is_new:
            enabled, auto_text = await self.get_auto_reply_config()
            if enabled:
                await self.crm.add_message(
                    ChatMessage(conversation_id=conversation.id, sender=ChatMessageSender.AUTO, body=auto_text)
                )
                conversation.last_message_at = utcnow()
                await self.crm.update_conversation(conversation)

            recipients = await self.users.list_by_permission("crm.view")
            await self.notifications.notify(
                [u.id for u in recipients],
                type="chat_message",
                title=f"New chat message from {conversation.visitor_name}",
                message=body[:120],
                link="/crm",
            )

        messages = await self.crm.list_messages(conversation.id)
        return conversation, messages

    async def list_messages_public(self, conversation_id: uuid.UUID) -> list[ChatMessage]:
        conversation = await self.crm.get_conversation(conversation_id)
        if conversation is None:
            raise NotFoundError("Conversation not found.")
        return await self.crm.list_messages(conversation_id)

    # -- admin-facing (authenticated) --

    async def list_conversations(self, *, page: int, per_page: int) -> tuple[list[ChatConversation], int]:
        return await self.crm.list_conversations(page=page, per_page=per_page)

    async def get_conversation_thread(self, conversation_id: uuid.UUID) -> tuple[ChatConversation, list[ChatMessage]]:
        conversation = await self.crm.get_conversation(conversation_id)
        if conversation is None:
            raise NotFoundError("Conversation not found.")
        if conversation.has_unread:
            conversation.has_unread = False
            conversation = await self.crm.update_conversation(conversation)
        messages = await self.crm.list_messages(conversation_id)
        return conversation, messages

    async def post_admin_reply(self, conversation_id: uuid.UUID, body: str, actor_id: uuid.UUID) -> ChatMessage:
        conversation = await self.crm.get_conversation(conversation_id)
        if conversation is None:
            raise NotFoundError("Conversation not found.")
        message = await self.crm.add_message(
            ChatMessage(conversation_id=conversation.id, sender=ChatMessageSender.ADMIN, body=body)
        )
        conversation.last_message_at = utcnow()
        await self.crm.update_conversation(conversation)
        await self.audit.log(actor_id, "crm.reply", "chat_conversation", conversation.id, details={"body": body[:200]})
        return message

    async def update_conversation(
        self, conversation_id: uuid.UUID, payload: ChatConversationUpdate, actor_id: uuid.UUID
    ) -> ChatConversation:
        conversation = await self.crm.get_conversation(conversation_id)
        if conversation is None:
            raise NotFoundError("Conversation not found.")
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(conversation, field, value)
        conversation = await self.crm.update_conversation(conversation)
        await self.audit.log(actor_id, "crm.update_conversation", "chat_conversation", conversation.id, details=data)
        return conversation
