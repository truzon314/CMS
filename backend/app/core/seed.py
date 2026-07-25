"""Seeds the 5 default roles, the full permission catalog, one initial Super
Admin user, the block-definition catalog, the 5 fixed pages, and — on first
run only — some real starter content on the Home page (borrowed from the
original Truzon Homes site, not lorem ipsum). Run with:

    python -m app.core.seed

Safe to re-run — skips anything that already exists.
"""

import asyncio
import os

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.shared.security.security import hash_password
from app.shared.database.session import AsyncSessionLocal
from app.models.block_definition import BlockDefinition
from app.models.entity_version import EntityType, EntityVersion
from app.models.form_submission import FormSubmission, FormSubmissionStatus
from app.models.menu import Menu, MenuItem
from app.models.page import Page, PageType
from app.models.page_block import PageBlock
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User

PERMISSIONS = [
    ("pages.view", "pages"),
    ("pages.edit", "pages"),
    ("pages.publish", "pages"),
    ("blog.view", "blog"),
    ("blog.create", "blog"),
    ("blog.edit", "blog"),
    ("blog.delete", "blog"),
    ("blog.publish", "blog"),
    ("properties.view", "properties"),
    ("properties.create", "properties"),
    ("properties.edit", "properties"),
    ("properties.delete", "properties"),
    ("properties.publish", "properties"),
    ("media.view", "media"),
    ("media.manage", "media"),
    ("users.view", "users"),
    ("users.manage", "users"),
    ("settings.manage", "settings"),
    ("forms.view", "forms"),
    ("forms.manage", "forms"),
    ("analytics.view", "analytics"),
    ("audit.view", "audit"),
    ("trash.manage", "trash"),
]

ALL_KEYS = [key for key, _ in PERMISSIONS]

ROLE_PERMISSIONS = {
    "Super Admin": ALL_KEYS,
    "Admin": [k for k in ALL_KEYS if k != "users.manage"],
    "Editor": [
        "pages.view", "pages.edit", "pages.publish",
        "blog.view", "blog.create", "blog.edit", "blog.delete", "blog.publish",
        "properties.view", "properties.create", "properties.edit", "properties.delete", "properties.publish",
        "media.view", "media.manage",
        "forms.view",
        "trash.manage",
    ],
    "Author": ["pages.view", "blog.view", "blog.create", "blog.edit", "media.view"],
    "Viewer": ["pages.view", "blog.view", "properties.view", "media.view", "forms.view", "analytics.view"],
}

ROLE_IS_SYSTEM = {"Super Admin": True}

# All 18 planned block types (COMPONENT_HIERARCHY.md) — only the first 5 have
# real editors in Phase 2 (ROADMAP.md); the rest just exist in the palette.
BLOCK_DEFINITIONS = [
    ("hero_banner", "Hero Banner"),
    ("text", "Text"),
    ("image", "Image"),
    ("gallery", "Gallery"),
    ("video", "Video"),
    ("faq", "FAQ"),
    ("testimonials", "Testimonials"),
    ("features", "Features"),
    ("pricing", "Pricing"),
    ("team", "Team"),
    ("timeline", "Timeline"),
    ("map", "Map"),
    ("accordion", "Accordion"),
    ("statistics", "Statistics"),
    ("contact_form", "Contact Form"),
    ("cta", "CTA"),
    ("spacer", "Spacer"),
    ("divider", "Divider"),
]

PAGES = [
    (PageType.HOME, "/", "Home"),
    (PageType.ABOUT, "/about", "About"),
    (PageType.PROJECTS, "/projects", "Projects"),
    (PageType.BLOG, "/blog", "Blog"),
    (PageType.CONTACT, "/contact", "Contact"),
]

MENUS = [
    ("header", "Header Navigation"),
    ("footer_company", "Footer — Company"),
    ("footer_properties", "Footer — Properties"),
    ("footer_resources", "Footer — Resources"),
    ("footer_legal", "Footer — Legal"),
]

# Real Truzon Homes header nav (mirrors my-app's actual top nav) — proves
# Phase 5's exit criteria with genuine content, not placeholder rows.
HEADER_ITEMS = [
    ("Home", PageType.HOME),
    ("About", PageType.ABOUT),
    ("Projects", PageType.PROJECTS),
    ("Blog", PageType.BLOG),
    ("Contact", PageType.CONTACT),
]

SAMPLE_FORM_SUBMISSIONS = [
    {
        "form_key": "hero_quick_enquiry",
        "name": "Priya Reddy",
        "phone": "+91 98480 12345",
        "email": "priya.reddy@example.com",
        "property_type_interest": "Villas",
        "message": "Interested in 4 BHK villas in Banjara Hills, budget around 3-5 Cr.",
        "status": FormSubmissionStatus.NEW,
    },
    {
        "form_key": "contact_callback",
        "name": "Arjun Mehta",
        "phone": "+91 90000 54321",
        "email": "arjun.mehta@example.com",
        "property_type_interest": "Apartments",
        "message": "Please call back regarding the Azure Heights project availability.",
        "status": FormSubmissionStatus.CONTACTED,
    },
]

# Real Truzon Homes copy (from the site's own content), not placeholder text.
HOME_FAQS = [
    {
        "q": "How can I book a site visit?",
        "a": 'Tap "Book Site Visit" or "Request a Callback" anywhere on the site, or call us '
        "directly. Our property consultants will confirm a slot within 24 hours and arrange "
        "transport for select projects.",
    },
    {
        "q": "Are all Truzon projects RERA registered?",
        "a": "Yes. Every Truzon Homes development carries DTCP approval and a valid RERA "
        "registration number, which we share upfront with all prospective buyers.",
    },
    {
        "q": "Do you provide customized interior solutions?",
        "a": "Our in-house design studio offers curated interior packages for villas and "
        "apartments, from material selection to full turnkey fit-outs.",
    },
    {
        "q": "What payment plans are available?",
        "a": "We offer construction-linked and milestone-based payment plans, along with "
        "flexible booking amounts depending on the project stage.",
    },
    {
        "q": "Do you help with home loans?",
        "a": "Yes, we work with leading banks and NBFCs to help you secure pre-approved "
        "financing with preferential rates.",
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        permissions_by_key: dict[str, Permission] = {}
        for key, module in PERMISSIONS:
            existing = (
                await session.execute(select(Permission).where(Permission.key == key))
            ).scalar_one_or_none()
            if existing is None:
                existing = Permission(key=key, module=module)
                session.add(existing)
                await session.flush()
            permissions_by_key[key] = existing

        roles_by_name: dict[str, Role] = {}
        for name, perm_keys in ROLE_PERMISSIONS.items():
            stmt = select(Role).where(Role.name == name).options(selectinload(Role.permissions))
            role = (await session.execute(stmt)).scalar_one_or_none()
            if role is None:
                role = Role(name=name, is_system=ROLE_IS_SYSTEM.get(name, False), permissions=[])
                session.add(role)
                await session.flush()
            role.permissions = [permissions_by_key[k] for k in perm_keys]
            roles_by_name[name] = role

        await session.commit()

        admin_email = os.environ.get("SEED_SUPERADMIN_EMAIL", "admin@truzonhomes.com")
        admin_password = os.environ.get("SEED_SUPERADMIN_PASSWORD", "ChangeMe123!")

        admin_user = (
            await session.execute(select(User).where(User.email == admin_email))
        ).scalar_one_or_none()
        if admin_user is None:
            super_admin_role = roles_by_name["Super Admin"]
            admin_user = User(
                email=admin_email,
                full_name="Super Admin",
                role_id=super_admin_role.id,
                password_hash=hash_password(admin_password),
                is_active=True,
                is_email_verified=True,
            )
            session.add(admin_user)
            await session.commit()
            print(f"Seeded Super Admin: {admin_email} / {admin_password} — change this password.")
        else:
            print(f"Super Admin {admin_email} already exists — skipped.")

        print(f"Seeded {len(permissions_by_key)} permissions and {len(roles_by_name)} roles.")

        block_defs_by_key: dict[str, BlockDefinition] = {}
        for key, label in BLOCK_DEFINITIONS:
            existing = (
                await session.execute(select(BlockDefinition).where(BlockDefinition.key == key))
            ).scalar_one_or_none()
            if existing is None:
                existing = BlockDefinition(key=key, label=label)
                session.add(existing)
                await session.flush()
            block_defs_by_key[key] = existing
        await session.commit()
        print(f"Seeded {len(block_defs_by_key)} block definitions.")

        pages_created = 0
        pages_by_type: dict[PageType, Page] = {}
        for page_type, slug, title in PAGES:
            existing_page = (
                await session.execute(select(Page).where(Page.page_type == page_type))
            ).scalar_one_or_none()
            if existing_page is not None:
                pages_by_type[page_type] = existing_page
                continue

            page = Page(
                page_type=page_type,
                slug=slug,
                title=title,
                created_by=admin_user.id,
                updated_by=admin_user.id,
            )
            session.add(page)
            await session.flush()
            pages_created += 1
            pages_by_type[page_type] = page

            if page_type == PageType.HOME:
                blocks = [
                    PageBlock(
                        page_id=page.id,
                        block_definition_id=block_defs_by_key["hero_banner"].id,
                        position=0,
                        config={
                            "button_label": "EXPLORE PROPERTIES",
                            "button_href": "#collections",
                            "slides": [
                                {
                                    "heading": "Building Dreams. Creating Futures.",
                                    "subheading": "Discover architectural masterpieces and "
                                    "premium investment opportunities in the most coveted "
                                    "locations. Experience the pinnacle of understated luxury.",
                                    "image_url": "",
                                },
                            ],
                        },
                    ),
                    PageBlock(
                        page_id=page.id,
                        block_definition_id=block_defs_by_key["text"].id,
                        position=1,
                        config={
                            "heading": "Why Choose Truzon Homes",
                            "body": "DTCP & RERA Approved. Transparent Deals. Prime Locations. "
                            "Unmatched Quality — every project is legally verified, honestly "
                            "priced, strategically located, and built to last.",
                        },
                    ),
                    PageBlock(
                        page_id=page.id,
                        block_definition_id=block_defs_by_key["faq"].id,
                        position=2,
                        config={"heading": "Common Questions", "items": HOME_FAQS},
                    ),
                    PageBlock(
                        page_id=page.id,
                        block_definition_id=block_defs_by_key["cta"].id,
                        position=3,
                        config={
                            "heading": "Ready to find your dream home?",
                            "description": "Our property consultants are available 24/7 to guide "
                            "you through our exclusive inventory and investment plans.",
                            "button_label": "REQUEST A CALLBACK",
                            "button_href": "/contact",
                        },
                    ),
                ]
                session.add_all(blocks)
                await session.flush()

                snapshot = {
                    "title": page.title,
                    "blocks": [
                        {
                            "block_definition_id": str(b.block_definition_id),
                            "position": b.position,
                            "config": b.config,
                        }
                        for b in blocks
                    ],
                }
                session.add(
                    EntityVersion(
                        entity_type=EntityType.PAGE,
                        entity_id=page.id,
                        version_number=1,
                        snapshot=snapshot,
                        change_note="Initial content",
                        created_by=admin_user.id,
                    )
                )

        await session.commit()
        print(f"Seeded {pages_created} new page(s) (5 fixed pages total).")

        menus_created = 0
        for key, label in MENUS:
            existing_menu = (
                await session.execute(select(Menu).where(Menu.key == key))
            ).scalar_one_or_none()
            if existing_menu is not None:
                continue

            menu = Menu(key=key, label=label)
            session.add(menu)
            await session.flush()
            menus_created += 1

            if key == "header":
                for position, (item_label, page_type) in enumerate(HEADER_ITEMS):
                    session.add(
                        MenuItem(
                            menu_id=menu.id,
                            label=item_label,
                            page_id=pages_by_type[page_type].id,
                            position=position,
                        )
                    )

        await session.commit()
        print(f"Seeded {menus_created} new menu(s) (5 fixed menus total).")

        submissions_created = 0
        existing_submission_count = (
            await session.execute(select(FormSubmission))
        ).scalars().first()
        if existing_submission_count is None:
            for entry in SAMPLE_FORM_SUBMISSIONS:
                session.add(FormSubmission(**entry))
                submissions_created += 1
            await session.commit()
        print(f"Seeded {submissions_created} sample form submission(s).")


if __name__ == "__main__":
    asyncio.run(seed())
