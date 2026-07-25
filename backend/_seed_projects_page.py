"""One-off: the Projects page (one of the CMS's 5 fixed pages) was DRAFT with
zero blocks, so my-app's /projects PageHero title/subtitle and closing CTA
were still hardcoded, unlike the property listing itself (already CMS-driven
via /public/properties). Seeds a text block (drives PageHero) + cta block
matching my-app's current copy, and publishes the page.

Run once with: python _seed_projects_page.py
"""

import asyncio

from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.block_definition import BlockDefinition
from app.models.page import Page, PageStatus, PageType
from app.models.page_block import PageBlock

HERO_TEXT = {
    "heading": "Our Projects",
    "body": "Villas, apartments, plots and gated communities across Hyderabad and Bangalore — "
    "every one DTCP-approved and RERA-registered.",
}

CTA = {
    "heading": "Can't find what you're looking for?",
    "description": "Tell us your requirements and our consultants will match you with upcoming inventory.",
    "button_label": "TALK TO A CONSULTANT",
    "button_href": "/contact",
}


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        defs = {row.key: row for row in (await session.execute(select(BlockDefinition))).scalars().all()}

        page = (await session.execute(select(Page).where(Page.page_type == PageType.PROJECTS))).scalar_one()
        existing = (await session.execute(select(PageBlock).where(PageBlock.page_id == page.id))).scalars().all()
        for b in existing:
            await session.delete(b)
        await session.flush()
        session.add_all(
            [
                PageBlock(page_id=page.id, block_definition_id=defs["text"].id, position=0, config=HERO_TEXT),
                PageBlock(page_id=page.id, block_definition_id=defs["cta"].id, position=1, config=CTA),
            ]
        )
        page.status = PageStatus.PUBLISHED
        await session.commit()
        print("Projects page: seeded text + cta blocks, published.")


if __name__ == "__main__":
    asyncio.run(seed())
