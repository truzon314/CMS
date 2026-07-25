import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import Menu, MenuItem


class SqlAlchemyMenuRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_key(self, key: str) -> Menu | None:
        stmt = select(Menu).where(Menu.key == key)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_all(self) -> list[Menu]:
        stmt = select(Menu).order_by(Menu.label)
        return list((await self.session.execute(stmt)).scalars().all())

    async def list_items(self, menu_id: uuid.UUID) -> list[MenuItem]:
        stmt = select(MenuItem).where(MenuItem.menu_id == menu_id).order_by(MenuItem.position)
        return list((await self.session.execute(stmt)).scalars().all())

    async def delete_all_items(self, menu_id: uuid.UUID) -> None:
        await self.session.execute(delete(MenuItem).where(MenuItem.menu_id == menu_id))
        await self.session.commit()

    async def create_item(self, item: MenuItem) -> MenuItem:
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item
