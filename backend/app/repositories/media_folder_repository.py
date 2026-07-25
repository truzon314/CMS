import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.media_folder import MediaFolder


class SqlAlchemyMediaFolderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, folder_id: uuid.UUID) -> MediaFolder | None:
        stmt = select(MediaFolder).where(MediaFolder.id == folder_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_all(self) -> list[MediaFolder]:
        stmt = select(MediaFolder).order_by(MediaFolder.name)
        return list((await self.session.execute(stmt)).scalars().all())

    async def create(self, folder: MediaFolder) -> MediaFolder:
        self.session.add(folder)
        await self.session.commit()
        await self.session.refresh(folder)
        return folder

    async def update(self, folder: MediaFolder) -> MediaFolder:
        await self.session.commit()
        await self.session.refresh(folder)
        return folder

    async def delete(self, folder: MediaFolder) -> None:
        await self.session.delete(folder)
        await self.session.commit()

    async def count_children(self, folder_id: uuid.UUID) -> int:
        stmt = select(func.count()).select_from(MediaFolder).where(MediaFolder.parent_folder_id == folder_id)
        return (await self.session.execute(stmt)).scalar_one()
