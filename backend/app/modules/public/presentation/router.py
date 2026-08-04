import math
import uuid

from fastapi import APIRouter, Depends, Header, Request, Response
from fastapi.responses import PlainTextResponse

from app.models.page import PageType
from app.schemas.crm import ChatMessageCreate, ChatMessageRead
from app.schemas.public import PublicFormSubmissionCreate
from app.services.crm_service import CrmService
from app.services.mapping_service import MappingService
from app.services.public_service import PublicService
from app.shared.dependencies.container import get_crm_service, get_mapping_service, get_public_service
from app.shared.security.rate_limit import rate_limit
from app.shared.utils.common import PaginationMeta, ok

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


@router.get("/careers")
async def list_public_careers(
    response: Response,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    careers = await public_service.list_careers()
    data = [public_service.to_public_career(c).model_dump(mode="json") for c in careers]
    return ok(data)


@router.get("/gallery")
async def list_public_gallery(
    response: Response,
    category: str | None = None,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    items = await public_service.list_gallery_items(category)
    data = [(await public_service.to_public_gallery_item(i)).model_dump(mode="json") for i in items]
    return ok(data)


@router.get("/testimonials")
async def list_public_testimonials(
    response: Response,
    featured_only: bool = False,
    public_service: PublicService = Depends(get_public_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    testimonials = await public_service.list_testimonials(featured_only)
    data = [(await public_service.to_public_testimonial(t)).model_dump(mode="json") for t in testimonials]
    return ok(data)


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


@router.get("/mapping/project/{project_id}")
async def get_public_map_project_by_id(
    project_id: uuid.UUID,
    response: Response,
    mapping: MappingService = Depends(get_mapping_service),
):
    """Read-only map data for a property page — no share token needed since
    the property itself is already public; this is just resolving the
    map_project_id a property links to, same shape as the share-token
    endpoint below minus the password/expiry/view-count gating."""
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    project = await mapping.get_project(project_id)
    layers = await mapping.list_layers(project_id)
    return ok({
        "project": {"id": str(project.id), "name": project.name, "map_provider_type": project.map_provider_type},
        "layers": [
            {
                "id": str(layer.id),
                "label": layer.label,
                "stroke_color": layer.stroke_color,
                "fill_color": layer.fill_color,
                "fill_opacity": layer.fill_opacity,
                "stroke_weight": layer.stroke_weight,
                "default_visible": layer.default_visible,
                "color_rules": layer.color_rules,
                "label_property": layer.label_property,
                "popup_enabled": layer.popup_enabled,
                "popup_properties": layer.popup_properties,
                "stroke_style": layer.stroke_style,
            }
            for layer in layers
        ],
    })


@router.get("/mapping/project/{project_id}/layers/{layer_id}")
async def get_public_map_layer_geojson_by_project(
    project_id: uuid.UUID,
    layer_id: uuid.UUID,
    response: Response,
    mapping: MappingService = Depends(get_mapping_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    layer = await mapping.get_layer(layer_id)
    if layer.project_id != project_id:
        from app.shared.exceptions.exceptions import NotFoundError

        raise NotFoundError("Layer not found in this project.")
    return ok(layer.geojson or {"type": "FeatureCollection", "features": []})


@router.get("/mapping/{token}")
async def get_public_map_project(
    token: str,
    x_share_password: str | None = Header(default=None),
    mapping: MappingService = Depends(get_mapping_service),
):
    project, layers = await mapping.resolve_public_project(token, x_share_password)
    return ok({
        "project": {"id": str(project.id), "name": project.name, "map_provider_type": project.map_provider_type},
        "layers": [
            {
                "id": str(layer.id),
                "label": layer.label,
                "stroke_color": layer.stroke_color,
                "fill_color": layer.fill_color,
                "fill_opacity": layer.fill_opacity,
                "stroke_weight": layer.stroke_weight,
                "default_visible": layer.default_visible,
                "color_rules": layer.color_rules,
                "label_property": layer.label_property,
                "popup_enabled": layer.popup_enabled,
                "popup_properties": layer.popup_properties,
                "stroke_style": layer.stroke_style,
            }
            for layer in layers
        ],
    })


@router.get("/mapping/{token}/layers/{layer_id}")
async def get_public_map_layer_geojson(
    token: str,
    layer_id: uuid.UUID,
    x_share_password: str | None = Header(default=None),
    mapping: MappingService = Depends(get_mapping_service),
):
    _project, layers = await mapping.resolve_public_project(token, x_share_password, count_view=False)
    layer = next((l for l in layers if l.id == layer_id), None)
    if layer is None:
        from app.shared.exceptions.exceptions import NotFoundError

        raise NotFoundError("Layer not found in this shared project.")
    return ok(layer.geojson or {"type": "FeatureCollection", "features": []})


@router.post("/forms/{form_key}")
async def submit_public_form(
    form_key: str,
    payload: PublicFormSubmissionCreate,
    request: Request,
    public_service: PublicService = Depends(get_public_service),
):
    rate_limit(request, scope="public.forms", limit=10, window_seconds=3600)

    ip_address = request.client.host if request.client else None
    submission = await public_service.submit_form(form_key, payload, ip_address)
    return ok({"id": str(submission.id), "status": submission.status.value})


@router.post("/chat/messages")
async def post_visitor_chat_message(
    payload: ChatMessageCreate,
    request: Request,
    crm: CrmService = Depends(get_crm_service),
):
    # A visitor can message as often as they type, but this still bounds
    # abuse the same way the lead forms are bounded — one shared scope name
    # keeps it a single limiter, not per-endpoint.
    rate_limit(request, scope="public.chat", limit=60, window_seconds=3600)

    conversation, messages = await crm.post_visitor_message(
        payload.conversation_id,
        payload.body,
        visitor_name=payload.visitor_name,
        visitor_email=payload.visitor_email,
        visitor_phone=payload.visitor_phone,
    )
    return ok({
        "conversation_id": str(conversation.id),
        "messages": [ChatMessageRead.model_validate(m).model_dump(mode="json") for m in messages],
    })


@router.get("/chat/conversations/{conversation_id}/messages")
async def get_visitor_chat_messages(
    conversation_id: uuid.UUID,
    crm: CrmService = Depends(get_crm_service),
):
    messages = await crm.list_messages_public(conversation_id)
    return ok({"messages": [ChatMessageRead.model_validate(m).model_dump(mode="json") for m in messages]})
