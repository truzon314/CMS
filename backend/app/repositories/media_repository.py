import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.media import Media


class SqlAlchemyMediaRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, media_id: uuid.UUID, include_deleted: bool = False) -> Media | None:
        stmt = select(Media).where(Media.id == media_id)
        if not include_deleted:
            stmt = stmt.where(Media.deleted_at.is_(None))
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list(
        self,
        *,
        page: int,
        per_page: int,
        folder_id: uuid.UUID | None = None,
        mime_type: str | None = None,
        search: str | None = None,
    ) -> tuple[list[Media], int]:
        stmt = select(Media).where(Media.deleted_at.is_(None))
        count_stmt = select(func.count()).select_from(Media).where(Media.deleted_at.is_(None))

        if folder_id is not None:
            stmt = stmt.where(Media.folder_id == folder_id)
            count_stmt = count_stmt.where(Media.folder_id == folder_id)
        if mime_type:
            stmt = stmt.where(Media.mime_type == mime_type)
            count_stmt = count_stmt.where(Media.mime_type == mime_type)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(Media.file_name.ilike(like))
            count_stmt = count_stmt.where(Media.file_name.ilike(like))

        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(Media.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), total

    async def create(self, media: Media) -> Media:
        self.session.add(media)
        await self.session.commit()
        await self.session.refresh(media)
        return media

    async def create_many(self, media_items: list[Media]) -> list[Media]:
        self.session.add_all(media_items)
        await self.session.commit()
        for media in media_items:
            await self.session.refresh(media)
        return media_items

    async def update(self, media: Media) -> Media:
        await self.session.commit()
        await self.session.refresh(media)
        return media

    async def list_trash(self, *, page: int, per_page: int) -> tuple[list[Media], int]:
        stmt = select(Media).where(Media.deleted_at.isnot(None))
        count_stmt = select(func.count()).select_from(Media).where(Media.deleted_at.isnot(None))

        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(Media.deleted_at.desc()).offset((page - 1) * per_page).limit(per_page)
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), total

    async def soft_delete(self, media: Media) -> None:
        media.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()

    async def restore(self, media: Media) -> None:
        media.deleted_at = None
        await self.session.commit()

    async def count_in_folder(self, folder_id: uuid.UUID) -> int:
        # Deliberately counts soft-deleted rows too: they still hold a real FK
        # to this folder (soft-delete doesn't clear `folder_id`), so deleting
        # the folder while one exists would 500 on the DB constraint instead
        # of the clean 409 this check is supposed to produce.
        stmt = select(func.count()).select_from(Media).where(Media.folder_id == folder_id)
        return (await self.session.execute(stmt)).scalar_one()
