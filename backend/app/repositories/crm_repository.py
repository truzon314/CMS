import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat_conversation import ChatConversation
from app.models.chat_message import ChatMessage

_WITH_ASSIGNEE = selectinload(ChatConversation.assignee)


class SqlAlchemyCrmRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_conversation(self, conversation: ChatConversation) -> ChatConversation:
        self.session.add(conversation)
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation

    async def get_conversation(self, conversation_id: uuid.UUID) -> ChatConversation | None:
        stmt = select(ChatConversation).where(ChatConversation.id == conversation_id).options(_WITH_ASSIGNEE)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_conversations(self, *, page: int, per_page: int) -> tuple[list[ChatConversation], int]:
        count_stmt = select(func.count()).select_from(ChatConversation)
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = (
            select(ChatConversation)
            .options(_WITH_ASSIGNEE)
            .order_by(ChatConversation.last_message_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), total

    async def update_conversation(self, conversation: ChatConversation) -> ChatConversation:
        await self.session.commit()
        await self.session.refresh(conversation, attribute_names=["assignee"])
        return conversation

    async def add_message(self, message: ChatMessage) -> ChatMessage:
        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)
        return message

    async def list_messages(self, conversation_id: uuid.UUID) -> list[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list((await self.session.execute(stmt)).scalars().all())
