import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.block_definition import BlockDefinition


class SqlAlchemyBlockDefinitionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self) -> list[BlockDefinition]:
        stmt = select(BlockDefinition).where(BlockDefinition.is_active.is_(True)).order_by(BlockDefinition.label)
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_by_id(self, definition_id: uuid.UUID) -> BlockDefinition | None:
        stmt = select(BlockDefinition).where(BlockDefinition.id == definition_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()
