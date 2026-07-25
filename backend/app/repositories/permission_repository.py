import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.permission import Permission


class SqlAlchemyPermissionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self) -> list[Permission]:
        stmt = select(Permission).order_by(Permission.module, Permission.key)
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_by_ids(self, ids: list[uuid.UUID]) -> list[Permission]:
        if not ids:
            return []
        stmt = select(Permission).where(Permission.id.in_(ids))
        return list((await self.session.execute(stmt)).scalars().all())
