"""One-off: About and Contact are 2 of the CMS's 5 fixed pages but were never
given real content or published (About had one blank leftover Gallery block,
Contact had zero blocks) — so my-app's /about and /contact pages have had
nothing to connect to. Seeds real content (matching my-app's own current
copy) for the sections that cleanly map to existing block types, and
publishes both pages.

Run once with: python _seed_about_contact.py
"""

import asyncio

from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.block_definition import BlockDefinition
from app.models.page import Page, PageStatus, PageType
from app.models.page_block import PageBlock

ABOUT_TEXT = {
    "heading": "Two decades of intent, not just construction",
    "body": "Truzon Homes was founded on a simple conviction: that a home should be as considered "
    "as it is comfortable. What began as a single residential project in Hyderabad has grown into "
    "a portfolio of 50+ villas, apartments, plots and gated communities across Hyderabad and "
    "Bangalore.\n\nEvery Truzon development is DTCP-approved and RERA-registered from day one — "
    "because trust, to us, is a design requirement, not an afterthought. Today over 5,000 families "
    "call a Truzon address home.",
}

ABOUT_CTA = {
    "heading": "Want to see our work up close?",
    "description": "Browse our current portfolio of villas, apartments, plots and gated communities.",
    "button_label": "VIEW OUR PROJECTS",
    "button_href": "/projects",
}

CONTACT_FORM_BLOCK = {
    "heading": "Request a Callback",
    "description": "Fill this in and a property consultant will reach out to arrange your site visit.",
    "form_key": "contact_callback",
}


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        defs = {
            row.key: row
            for row in (await session.execute(select(BlockDefinition))).scalars().all()
        }

        about = (await session.execute(select(Page).where(Page.page_type == PageType.ABOUT))).scalar_one()
        existing_about_blocks = (
            await session.execute(select(PageBlock).where(PageBlock.page_id == about.id))
        ).scalars().all()
        for b in existing_about_blocks:
            await session.delete(b)
        await session.flush()
        session.add_all(
            [
                PageBlock(page_id=about.id, block_definition_id=defs["text"].id, position=0, config=ABOUT_TEXT),
                PageBlock(page_id=about.id, block_definition_id=defs["cta"].id, position=1, config=ABOUT_CTA),
            ]
        )
        about.status = PageStatus.PUBLISHED
        await session.commit()
        print("About page: seeded text + cta blocks, published.")

        contact = (await session.execute(select(Page).where(Page.page_type == PageType.CONTACT))).scalar_one()
        existing_contact_blocks = (
            await session.execute(select(PageBlock).where(PageBlock.page_id == contact.id))
        ).scalars().all()
        for b in existing_contact_blocks:
            await session.delete(b)
        await session.flush()
        session.add(
            PageBlock(
                page_id=contact.id, block_definition_id=defs["contact_form"].id, position=0, config=CONTACT_FORM_BLOCK
            )
        )
        contact.status = PageStatus.PUBLISHED
        await session.commit()
        print("Contact page: seeded contact_form block, published.")


if __name__ == "__main__":
    asyncio.run(seed())
