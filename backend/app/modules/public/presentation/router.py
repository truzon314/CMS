import math

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


def _get_feature_centroid(feat: dict) -> tuple[float, float] | None:
    """Return (lat, lng) centroid of a GeoJSON feature, or None if not computable."""
    try:
        coords = feat["geometry"]["coordinates"]
        gtype = feat["geometry"]["type"]
        pts: list[tuple[float, float]] = []

        def _collect(obj: object) -> None:
            if isinstance(obj, list):
                if obj and isinstance(obj[0], (int, float)):
                    pts.append((float(obj[1]), float(obj[0])))  # (lat, lng)
                else:
                    for item in obj:
                        _collect(item)

        _collect(coords)
        if not pts:
            return None
        return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
    except Exception:
        return None


def _filter_geojson_by_bounds(geojson: dict, bounds: dict | None) -> dict:
    """
    Drop features whose centroid lies outside the project's stored bounding box.

    This prevents stray features from other projects (accidentally uploaded in
    the same GeoJSON file) from appearing on the wrong property map.

    Safe no-op when bounds is None — no features are ever removed in that case.
    """
    if not bounds or not isinstance(geojson, dict):
        return geojson
    features = geojson.get("features")
    if not isinstance(features, list):
        return geojson

    min_lat = bounds.get("min_lat", -90)
    max_lat = bounds.get("max_lat",  90)
    min_lng = bounds.get("min_lng", -180)
    max_lng = bounds.get("max_lng",  180)

    filtered = []
    for feat in features:
        centroid = _get_feature_centroid(feat)
        if centroid is None:
            filtered.append(feat)  # can't determine location — keep it
            continue
        lat, lng = centroid
        if min_lat <= lat <= max_lat and min_lng <= lng <= max_lng:
            filtered.append(feat)
        # else: silently drop — stray feature from another project

    return {**geojson, "features": filtered}


def _update_project_bounds(project, layer_geojson: dict | None) -> None:
    """
    Re-compute and update the project's geojson_filter_bounds in-place
    after a layer's GeoJSON is saved.  Called by the CMS layer-save path
    so bounds stay accurate as new data is uploaded.
    """
    if not layer_geojson or not isinstance(layer_geojson.get("features"), list):
        return

    features = layer_geojson["features"]
    lats, lngs = [], []
    for feat in features:
        c = _get_feature_centroid(feat)
        if c:
            lats.append(c[0])
            lngs.append(c[1])

    if not lats:
        return

    pad = 0.008  # ~800 m buffer
    new_bounds = {
        "min_lat": min(lats) - pad,
        "max_lat": max(lats) + pad,
        "min_lng": min(lngs) - pad,
        "max_lng": max(lngs) + pad,
    }

    existing = project.geojson_filter_bounds or {}
    merged = {
        "min_lat": min(existing.get("min_lat",  90), new_bounds["min_lat"]),
        "max_lat": max(existing.get("max_lat", -90), new_bounds["max_lat"]),
        "min_lng": min(existing.get("min_lng", 180), new_bounds["min_lng"]),
        "max_lng": max(existing.get("max_lng", -180), new_bounds["max_lng"]),
    }
    project.geojson_filter_bounds = merged


@router.get("/pages/{page_type}")
async def get_public_page(
    page_type: str,
    response: Response,
    public_service: PublicService = Depends(get_public_service),
):
    try:
        pt_enum = PageType[page_type.upper()]
    except KeyError:
        from app.shared.exceptions.exceptions import NotFoundError
        raise NotFoundError(f"Page type '{page_type}' not found.")
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    page = await public_service.get_page(pt_enum)
    return ok(page.model_dump(mode="json"))


@router.get("/blog")
async def list_public_blog_posts(
    response: Response,
    page: int = 1,
    per_page: int = 20,
    category: str | None = None,
    tag: str | None = None,
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
    type: str | None = None,
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
    project_id: str,
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
                "label_alignment": layer.label_alignment,
                "popup_enabled": layer.popup_enabled,
                "popup_properties": layer.popup_properties,
                "stroke_style": layer.stroke_style,
            }
            for layer in layers
        ],
    })


@router.get("/mapping/project/{project_id}/layers/{layer_id}")
async def get_public_map_layer_geojson_by_project(
    project_id: str,
    layer_id: str,
    response: Response,
    mapping: MappingService = Depends(get_mapping_service),
):
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300"
    layer = await mapping.get_layer(layer_id)
    if str(layer.project_id) != str(project_id):
        from app.shared.exceptions.exceptions import NotFoundError
        raise NotFoundError("Layer not found in this project.")

    # Fetch project to get its stored bounds, then strip stray features
    project = await mapping.get_project(project_id)
    bounds = project.geojson_filter_bounds if project else None
    geojson = layer.geojson or {"type": "FeatureCollection", "features": []}
    return ok(_filter_geojson_by_bounds(geojson, bounds))


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
                "label_alignment": layer.label_alignment,
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
    layer_id: str,
    x_share_password: str | None = Header(default=None),
    mapping: MappingService = Depends(get_mapping_service),
):
    project, layers = await mapping.resolve_public_project(token, x_share_password, count_view=False)
    layer = next((l for l in layers if l.id == layer_id), None)
    if layer is None:
        from app.shared.exceptions.exceptions import NotFoundError
        raise NotFoundError("Layer not found in this shared project.")
    bounds = project.geojson_filter_bounds if project else None
    geojson = layer.geojson or {"type": "FeatureCollection", "features": []}
    return ok(_filter_geojson_by_bounds(geojson, bounds))


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
    status_str = getattr(submission.status, "value", str(submission.status))
    return ok({"id": str(submission.id), "status": status_str})



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
    conversation_id: str,
    crm: CrmService = Depends(get_crm_service),
):
    messages = await crm.list_messages_public(conversation_id)
    return ok({"messages": [ChatMessageRead.model_validate(m).model_dump(mode="json") for m in messages]})
