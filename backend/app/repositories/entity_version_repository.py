import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_version import EntityType, EntityVersion


class SqlAlchemyEntityVersionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, version: EntityVersion) -> EntityVersion:
        self.session.add(version)
        await self.session.commit()
        await self.session.refresh(version)
        return version

    async def list_for_entity(self, entity_type: EntityType, entity_id: uuid.UUID | str) -> list[EntityVersion]:
        stmt = (
            select(EntityVersion)
            .where(EntityVersion.entity_type == entity_type, EntityVersion.entity_id == str(entity_id))
            .order_by(EntityVersion.version_number.desc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_by_id(self, version_id: uuid.UUID | str) -> EntityVersion | None:
        stmt = select(EntityVersion).where(EntityVersion.id == str(version_id))
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def next_version_number(self, entity_type: EntityType, entity_id: uuid.UUID | str) -> int:
        stmt = select(func.coalesce(func.max(EntityVersion.version_number), 0)).where(
            EntityVersion.entity_type == entity_type, EntityVersion.entity_id == str(entity_id)
        )
        current_max = (await self.session.execute(stmt)).scalar_one()
        return current_max + 1
