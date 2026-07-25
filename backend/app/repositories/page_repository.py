import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.page import Page, PageType
from app.models.page_block import PageBlock
from app.models.seo_meta import SeoMeta

_WITH_RELATIONS = (
    selectinload(Page.seo),
    selectinload(Page.blocks).selectinload(PageBlock.block_definition),
)


class SqlAlchemyPageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_type(self, page_type: PageType) -> Page | None:
        stmt = select(Page).where(Page.page_type == page_type).options(*_WITH_RELATIONS)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_all(self) -> list[Page]:
        stmt = select(Page).options(*_WITH_RELATIONS).order_by(Page.page_type)
        return list((await self.session.execute(stmt)).scalars().all())

    async def update(self, page: Page) -> Page:
        await self.session.commit()
        await self.session.refresh(page, attribute_names=["seo", "blocks"])
        return page

    async def get_block(self, block_id: uuid.UUID) -> PageBlock | None:
        stmt = (
            select(PageBlock)
            .where(PageBlock.id == block_id)
            .options(selectinload(PageBlock.block_definition))
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def add_block(self, block: PageBlock) -> PageBlock:
        self.session.add(block)
        await self.session.commit()
        await self.session.refresh(block)
        return block

    async def update_block(self, block: PageBlock) -> PageBlock:
        await self.session.commit()
        await self.session.refresh(block)
        return block

    async def delete_block(self, block: PageBlock) -> None:
        await self.session.delete(block)
        await self.session.commit()

    async def reorder_blocks(self, page_id: uuid.UUID, ordered_block_ids: list[uuid.UUID]) -> None:
        stmt = select(PageBlock).where(PageBlock.page_id == page_id)
        blocks = {b.id: b for b in (await self.session.execute(stmt)).scalars().all()}
        for position, block_id in enumerate(ordered_block_ids):
            if block_id in blocks:
                blocks[block_id].position = position
        await self.session.commit()

    async def max_block_position(self, page_id: uuid.UUID) -> int:
        stmt = select(func.coalesce(func.max(PageBlock.position), -1)).where(PageBlock.page_id == page_id)
        return (await self.session.execute(stmt)).scalar_one()

    async def upsert_seo(self, page: Page, seo_data: dict) -> Page:
        if page.seo is None:
            seo = SeoMeta(**seo_data)
            self.session.add(seo)
            await self.session.flush()
            page.seo_id = seo.id
        else:
            for field, value in seo_data.items():
                setattr(page.seo, field, value)
        await self.session.commit()
        await self.session.refresh(page, attribute_names=["seo", "blocks"])
        return page
