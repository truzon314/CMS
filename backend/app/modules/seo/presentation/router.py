from datetime import datetime, timezone
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.domain.repositories.blog_post_repository import BlogPostRepository
from app.domain.repositories.media_repository import MediaRepository
from app.domain.repositories.page_repository import PageRepository
from app.domain.repositories.property_repository import PropertyRepository
from app.domain.repositories.settings_repository import SettingsRepository
from app.models.user import User
from app.schemas.settings import KNOWN_SETTING_KEYS
from app.services.schema_service import SchemaService
from app.services.seo_integrations_service import SeoIntegrationsService
from app.shared.dependencies.container import (
    get_blog_post_repository,
    get_media_repository,
    get_page_repository,
    get_property_repository,
    get_seo_integrations_service,
    get_settings_repository,
)
from app.shared.utils.common import ok

router = APIRouter(prefix="/seo", tags=["seo"])


async def _run_audit(
    pages_repo: PageRepository,
    posts_repo: BlogPostRepository,
    props_repo: PropertyRepository,
    media_repo: MediaRepository,
) -> dict:
    pages = await pages_repo.list_all()
    posts, _ = await posts_repo.list(page=1, per_page=1000, status=None, category_id=None, tag_id=None, search=None)
    properties, _ = await props_repo.list(page=1, per_page=1000, status=None, city=None, category_id=None, budget_bracket=None, is_signature=None)
    media_items, _ = await media_repo.list(page=1, per_page=1000, folder_id=None, search=None, mime_type=None)

    missing_meta_desc = []
    missing_seo_title = []
    duplicate_titles: dict[str, list[dict]] = {}

    all_entities = (
        [("Page", p.title, p.seo, f"/pages/{p.page_type.value}") for p in pages] +
        [("Blog Post", b.title, b.seo, f"/blog/{b.id}") for b in posts] +
        [("Property", pr.name, pr.seo, f"/properties/{pr.id}") for pr in properties]
    )

    for entity_type, raw_name, seo, link in all_entities:
        title = (seo and seo.seo_title) or raw_name
        desc = seo and seo.meta_description

        if not desc:
            missing_meta_desc.append({"type": entity_type, "name": raw_name, "link": link})
        if not seo or not seo.seo_title:
            missing_seo_title.append({"type": entity_type, "name": raw_name, "link": link})

        duplicate_titles.setdefault(title.lower(), []).append({"type": entity_type, "name": raw_name, "link": link})

    duplicates = [
        {"title": title, "count": len(items), "items": items}
        for title, items in duplicate_titles.items()
        if len(items) > 1
    ]

    missing_alt_images = [
        {"id": str(m.id), "filename": m.file_name, "url": m.url}
        for m in media_items
        if m.mime_type.startswith("image/") and not (m.alt_text and m.alt_text.strip())
    ]

    total_entities = len(all_entities)
    health_score = 100
    if total_entities > 0:
        penalty = (len(missing_meta_desc) * 5 + len(missing_seo_title) * 5 + len(duplicates) * 10 + len(missing_alt_images) * 2)
        health_score = max(0, 100 - min(100, penalty))

    return {
        "health_score": health_score,
        "total_pages_scanned": total_entities,
        "total_images_scanned": len([m for m in media_items if m.mime_type.startswith("image/")]),
        "missing_meta_description": missing_meta_desc,
        "missing_seo_title": missing_seo_title,
        "duplicate_titles": duplicates,
        "missing_alt_images": missing_alt_images,
    }


class AiGenerateRequest(BaseModel):
    task_type: Literal["title", "description", "keywords", "alt_text", "faqs", "property_description"]
    topic_or_context: str
    target_keyword: str | None = None


@router.get("/audit")
async def get_seo_audit(
    pages_repo: PageRepository = Depends(get_page_repository),
    posts_repo: BlogPostRepository = Depends(get_blog_post_repository),
    props_repo: PropertyRepository = Depends(get_property_repository),
    media_repo: MediaRepository = Depends(get_media_repository),
    _=Depends(require_permission("pages.view")),
):
    return ok(await _run_audit(pages_repo, posts_repo, props_repo, media_repo))


@router.post("/ai-generate")
async def ai_generate_seo(
    payload: AiGenerateRequest,
    user: User = Depends(get_current_user),
    _=Depends(require_permission("pages.edit")),
):
    topic = payload.topic_or_context.strip()
    keyword = payload.target_keyword.strip() if payload.target_keyword else topic

    if payload.task_type == "title":
        suggestion = f"{topic.title()} — Luxury Real Estate | Truzon Homes"
        if len(suggestion) > 60:
            suggestion = f"{topic.title()} | Truzon Homes"
        return ok({"suggestion": suggestion, "task_type": payload.task_type})

    elif payload.task_type == "description":
        suggestion = f"Explore {topic} with Truzon Homes. Premium architecture, DTCP & RERA approved developments, transparent pricing, and world-class amenities in prime locations."
        return ok({"suggestion": suggestion, "task_type": payload.task_type})

    elif payload.task_type == "keywords":
        base_kw = [keyword.lower(), f"{keyword.lower()} for sale", f"best {keyword.lower()}", "truzon homes", "luxury real estate", "hyderabad properties"]
        return ok({"keywords": list(dict.fromkeys(base_kw)), "task_type": payload.task_type})

    elif payload.task_type == "alt_text":
        suggestion = f"Modern architectural view of {topic} by Truzon Homes"
        return ok({"suggestion": suggestion, "task_type": payload.task_type})

    elif payload.task_type == "faqs":
        faqs = [
            {"q": f"What makes {topic} a great investment?", "a": f"{topic} offers exceptional architectural quality, prime location connectivity, and high potential for capital appreciation."},
            {"q": f"Are properties in {topic} RERA approved?", "a": "Yes, all Truzon Homes developments are fully legally verified with valid RERA and DTCP approvals."},
            {"q": f"How do I schedule a site visit for {topic}?", "a": "You can request a callback directly through our contact form or call our property experts 24/7."},
        ]
        return ok({"faqs": faqs, "task_type": payload.task_type})

    elif payload.task_type == "property_description":
        suggestion = f"Discover understated luxury at {topic}. Thoughtfully designed with expansive living spaces, premium fit-outs, private green corridors, and top-tier security infrastructure."
        return ok({"suggestion": suggestion, "task_type": payload.task_type})

    raise HTTPException(status_code=400, detail="Unsupported task type.")


@router.get("/schema/global")
async def get_global_schema(
    settings_repo: SettingsRepository = Depends(get_settings_repository),
):
    rows = await settings_repo.get_all()
    values = {row.key: row.value for row in rows if row.key in KNOWN_SETTING_KEYS}
    
    org_schema = SchemaService.generate_organization_schema(values)
    local_schema = SchemaService.generate_local_business_schema(values)
    website_schema = SchemaService.generate_website_schema(values)

    return ok({
        "organization": org_schema,
        "local_business": local_schema,
        "website": website_schema,
    })


@router.get("/export")
async def export_seo_report(
    pages_repo: PageRepository = Depends(get_page_repository),
    posts_repo: BlogPostRepository = Depends(get_blog_post_repository),
    props_repo: PropertyRepository = Depends(get_property_repository),
    media_repo: MediaRepository = Depends(get_media_repository),
    _=Depends(require_permission("pages.view")),
):
    audit = await _run_audit(pages_repo, posts_repo, props_repo, media_repo)
    return ok({"generated_at": datetime.now(timezone.utc).isoformat(), **audit})


@router.get("/autocomplete")
async def get_autocomplete(
    q: str,
    integrations: SeoIntegrationsService = Depends(get_seo_integrations_service),
    _=Depends(require_permission("pages.view")),
):
    try:
        suggestions = await integrations.autocomplete(q)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Autocomplete lookup failed: {e}") from e
    return ok({"query": q, "suggestions": suggestions})


@router.get("/pagespeed")
async def get_pagespeed(
    url: str = "https://truzonhomes.com",
    integrations: SeoIntegrationsService = Depends(get_seo_integrations_service),
    _=Depends(require_permission("pages.view")),
):
    try:
        return ok(await integrations.pagespeed(url))
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"PageSpeed Insights request failed: {e}") from e


@router.get("/rankings")
async def get_rankings(
    integrations: SeoIntegrationsService = Depends(get_seo_integrations_service),
    _=Depends(require_permission("pages.view")),
):
    try:
        return ok(await integrations.search_console_rankings())
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Search Console request failed: {e}") from e
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid Search Console credentials: {e}") from e


@router.get("/backlinks")
async def get_backlinks(
    target: str = "truzonhomes.com",
    integrations: SeoIntegrationsService = Depends(get_seo_integrations_service),
    _=Depends(require_permission("pages.view")),
):
    try:
        return ok(await integrations.ahrefs_backlinks(target))
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Ahrefs request failed: {e}") from e
