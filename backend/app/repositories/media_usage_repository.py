import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.media_usage import MediaUsage, MediaUsageEntityType


class SqlAlchemyMediaUsageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_for_media(self, media_id: uuid.UUID) -> list[MediaUsage]:
        stmt = select(MediaUsage).where(MediaUsage.media_id == media_id)
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_for_field(
        self, entity_type: MediaUsageEntityType, entity_id: uuid.UUID, field_name: str
    ) -> MediaUsage | None:
        stmt = select(MediaUsage).where(
            MediaUsage.entity_type == entity_type,
            MediaUsage.entity_id == entity_id,
            MediaUsage.field_name == field_name,
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def upsert(
        self, entity_type: MediaUsageEntityType, entity_id: uuid.UUID, field_name: str, media_id: uuid.UUID
    ) -> MediaUsage:
        existing = await self.get_for_field(entity_type, entity_id, field_name)
        if existing:
            existing.media_id = media_id
            await self.session.commit()
            await self.session.refresh(existing)
            return existing

        usage = MediaUsage(entity_type=entity_type, entity_id=entity_id, field_name=field_name, media_id=media_id)
        self.session.add(usage)
        await self.session.commit()
        await self.session.refresh(usage)
        return usage

    async def delete_for_field(
        self, entity_type: MediaUsageEntityType, entity_id: uuid.UUID, field_name: str
    ) -> None:
        stmt = delete(MediaUsage).where(
            MediaUsage.entity_type == entity_type,
            MediaUsage.entity_id == entity_id,
            MediaUsage.field_name == field_name,
        )
        await self.session.execute(stmt)
        await self.session.commit()
