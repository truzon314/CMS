import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import Setting


class SqlAlchemySettingsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self) -> list[Setting]:
        stmt = select(Setting)
        return list((await self.session.execute(stmt)).scalars().all())

    async def upsert(self, key: str, value: Any, updated_by: uuid.UUID) -> Setting:
        stmt = select(Setting).where(Setting.key == key)
        setting = (await self.session.execute(stmt)).scalar_one_or_none()
        if setting is None:
            setting = Setting(key=key, value=value, updated_by=updated_by)
            self.session.add(setting)
        else:
            setting.value = value
            setting.updated_by = updated_by
        await self.session.commit()
        await self.session.refresh(setting)
        return setting
