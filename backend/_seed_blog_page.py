"""One-off: the Blog page (one of the CMS's 5 fixed pages) was DRAFT with
zero blocks, same as Projects/About/Contact were before those were fixed —
so my-app's /blog PageHero title/subtitle and closing CTA are still
hardcoded, unlike the post listing itself (already CMS-driven via
/public/blog). Seeds a text block (drives PageHero) + cta block matching
my-app's current copy, and publishes the page.

Run once with: python _seed_blog_page.py
"""

import asyncio

from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.block_definition import BlockDefinition
from app.models.page import Page, PageStatus, PageType
from app.models.page_block import PageBlock

HERO_TEXT = {
    "heading": "Insights & Articles",
    "body": "Market trends, buying guides and life inside a Truzon community.",
}

CTA = {
    "heading": "Have a question we haven't covered?",
    "description": "Our consultants are happy to walk you through anything — market timing, financing, or a "
    "specific project.",
    "button_label": "ASK OUR TEAM",
    "button_href": "/contact",
}


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        defs = {row.key: row for row in (await session.execute(select(BlockDefinition))).scalars().all()}

        page = (await session.execute(select(Page).where(Page.page_type == PageType.BLOG))).scalar_one()
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
        print("Blog page: seeded text + cta blocks, published.")


if __name__ == "__main__":
    asyncio.run(seed())
