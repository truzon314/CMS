"""`/public/*` (API.md) — unauthenticated, read-only except form submission.
This is the only surface `my-app` calls; no `/api/v1` prefix, no auth
dependency on any route here."""

import math
import uuid

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import PlainTextResponse

from app.core.container import get_public_service
from app.core.rate_limit import rate_limit
from app.models.page import PageType
from app.schemas.common import PaginationMeta, ok
from app.schemas.public import PublicFormSubmissionCreate
from app.services.public_service import PublicService

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/pages/{page_type}")
async def get_public_page(
    page_type: PageType,
    response: Response,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    page = await public_service.get_page(page_type)
    return ok(page.model_dump(mode="json"))


@router.get("/blog")
async def list_public_blog_posts(
    response: Response,
    page: int = 1,
    per_page: int = 20,
    category: uuid.UUID | None = None,
    tag: uuid.UUID | None = None,
    search: str | None = None,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    posts, total = await public_service.list_blog_posts(
        page=page, per_page=per_page, category=category, tag=tag, search=search
    )
    data = [(await public_service.to_public_blog_post_list_item(p)).model_dump(mode="json") for p in posts]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.get("/blog/{slug}")
async def get_public_blog_post(
    slug: str,
    response: Response,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    post = await public_service.get_blog_post(slug)
    result = await public_service.to_public_blog_post(post)
    return ok(result.model_dump(mode="json"))


@router.get("/properties")
async def list_public_properties(
    response: Response,
    page: int = 1,
    per_page: int = 20,
    city: str | None = None,
    type: uuid.UUID | None = None,
    budget: str | None = None,
    signature: bool | None = None,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    properties, total = await public_service.list_properties(
        page=page, per_page=per_page, city=city, category_id=type, budget_bracket=budget, signature=signature
    )
    data = [(await public_service.to_public_property_list_item(p)).model_dump(mode="json") for p in properties]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.get("/properties/{slug}")
async def get_public_property(
    slug: str,
    response: Response,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    property_ = await public_service.get_property(slug)
    result = await public_service.to_public_property(property_)
    return ok(result.model_dump(mode="json"))


@router.get("/menus/{key}")
async def get_public_menu(
    key: str,
    response: Response,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    menu = await public_service.get_menu(key)
    return ok(menu.model_dump(mode="json"))


@router.get("/settings")
async def get_public_settings(
    response: Response,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    settings = await public_service.get_settings()
    return ok(settings.model_dump(mode="json"))


@router.get("/sitemap")
async def get_sitemap_data(
    response: Response,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=300, s-maxage=600"
    return ok(await public_service.sitemap_entries())


@router.get("/robots.txt", response_class=PlainTextResponse)
async def get_robots_txt(
    response: Response,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=300, s-maxage=600"
    return await public_service.robots_txt()


@router.get("/categories")
async def list_public_categories(
    applies_to: str | None = None,
    public_service: PublicService = Depends(get_public_service),
):
    categories = await public_service.list_categories(applies_to)
    data = [{"id": str(c.id), "name": c.name, "slug": c.slug} for c in categories]
    return ok(data)


@router.post("/forms/{form_key}")
async def submit_public_form(
    form_key: str,
    payload: PublicFormSubmissionCreate,
    request: Request,
    public_service: PublicService = Depends(get_public_service),
):
    # Public write endpoint — a spam vector into the sales team's inbox without this
    # (SECURITY_CHECKLIST.md §7).
    rate_limit(request, scope="public.forms", limit=10, window_seconds=3600)

    ip_address = request.client.host if request.client else None
    submission = await public_service.submit_form(form_key, payload, ip_address)
    return ok({"id": str(submission.id), "status": submission.status.value})
