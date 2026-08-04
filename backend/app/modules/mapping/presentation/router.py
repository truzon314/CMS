import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.models.user import User
from app.schemas.mapping import (
    MapFeatureUpdate,
    MapLayerRead,
    MapLayerStyleUpdate,
    MapLayerUploadRequest,
    MapProjectCreate,
    MapProjectRead,
    MapProjectUpdate,
    MapProviderConfigRead,
    MapProviderConfigUpsert,
    MapShareLinkRead,
    MapShareLinkUpsert,
)
from app.services.mapping_service import MappingService
from app.shared.dependencies.container import get_mapping_service
from app.shared.utils.common import ok

router = APIRouter(prefix="/mapping", tags=["mapping"])


def _project_read(project) -> dict:
    return MapProjectRead(
        id=project.id,
        name=project.name,
        map_provider_type=project.map_provider_type,
        share_token=project.share_link.token if project.share_link else None,
        created_at=project.created_at,
        updated_at=project.updated_at,
    ).model_dump(mode="json")


def _share_link_read(link) -> dict:
    return MapShareLinkRead(
        id=link.id,
        project_id=link.project_id,
        token=link.token,
        is_active=link.is_active,
        has_password=bool(link.password_hash),
        expires_at=link.expires_at,
        max_views=link.max_views,
        view_count=link.view_count,
        created_at=link.created_at,
    ).model_dump(mode="json")


# -- projects --------------------------------------------------------------


@router.get("/projects")
async def list_projects(
    mapping: MappingService = Depends(get_mapping_service),
    _=Depends(require_permission("mapping.view")),
):
    projects = await mapping.list_projects()
    return ok([_project_read(p) for p in projects])


@router.post("/projects")
async def create_project(
    payload: MapProjectCreate,
    mapping: MappingService = Depends(get_mapping_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("mapping.edit")),
):
    project = await mapping.create_project(payload, user.id)
    return ok(_project_read(project))


@router.patch("/projects/{project_id}")
async def update_project(
    project_id: uuid.UUID,
    payload: MapProjectUpdate,
    mapping: MappingService = Depends(get_mapping_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("mapping.edit")),
):
    project = await mapping.update_project(project_id, payload, user.id)
    return ok(_project_read(project))


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: uuid.UUID,
    mapping: MappingService = Depends(get_mapping_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("mapping.edit")),
):
    await mapping.delete_project(project_id, user.id)
    return ok({"deleted": True})


# -- layers ------------------------------------------------------------------


@router.get("/layers")
async def list_layers(
    project_id: uuid.UUID | None = Query(default=None),
    mapping: MappingService = Depends(get_mapping_service),
    _=Depends(require_permission("mapping.view")),
):
    layers = await mapping.list_layers(project_id)
    return ok([MapLayerRead.model_validate(layer).model_dump(mode="json") for layer in layers])


@router.get("/layers/{layer_id}")
async def get_layer(
    layer_id: uuid.UUID,
    mapping: MappingService = Depends(get_mapping_service),
    _=Depends(require_permission("mapping.view")),
):
    layer = await mapping.get_layer(layer_id)
    return ok(MapLayerRead.model_validate(layer).model_dump(mode="json"))


@router.post("/layers/upload")
async def upload_layer(
    payload: MapLayerUploadRequest,
    mapping: MappingService = Depends(get_mapping_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("mapping.edit")),
):
    layer = await mapping.upload_layer(payload, user.id)
    return ok(MapLayerRead.model_validate(layer).model_dump(mode="json"))


@router.patch("/layers/{layer_id}")
async def update_layer_style(
    layer_id: uuid.UUID,
    payload: MapLayerStyleUpdate,
    mapping: MappingService = Depends(get_mapping_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("mapping.edit")),
):
    layer = await mapping.update_layer_style(layer_id, payload, user.id)
    return ok(MapLayerRead.model_validate(layer).model_dump(mode="json"))


@router.delete("/layers/{layer_id}")
async def delete_layer(
    layer_id: uuid.UUID,
    mapping: MappingService = Depends(get_mapping_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("mapping.edit")),
):
    await mapping.delete_layer(layer_id, user.id)
    return ok({"deleted": True})


@router.put("/layers/{layer_id}/features")
async def update_layer_features(
    layer_id: uuid.UUID,
    payload: MapFeatureUpdate,
    mapping: MappingService = Depends(get_mapping_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("mapping.edit")),
):
    result = await mapping.update_layer_features(layer_id, payload, user.id)
    return ok(result)


# -- share links -------------------------------------------------------------


@router.get("/share-links")
async def get_share_link(
    project_id: uuid.UUID = Query(...),
    mapping: MappingService = Depends(get_mapping_service),
    _=Depends(require_permission("mapping.view")),
):
    link = await mapping.get_share_link_for_project(project_id)
    return ok(_share_link_read(link) if link else None)


@router.post("/share-links")
async def upsert_share_link(
    payload: MapShareLinkUpsert,
    mapping: MappingService = Depends(get_mapping_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("mapping.edit")),
):
    link = await mapping.upsert_share_link(payload, user.id)
    return ok(_share_link_read(link))


# -- provider configs ----------------------------------------------------


@router.get("/providers")
async def list_providers(
    mapping: MappingService = Depends(get_mapping_service),
    _=Depends(require_permission("mapping.view")),
):
    providers = await mapping.list_providers()
    return ok([MapProviderConfigRead.model_validate(p).model_dump(mode="json") for p in providers])


@router.post("/providers")
async def upsert_provider(
    payload: MapProviderConfigUpsert,
    mapping: MappingService = Depends(get_mapping_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("mapping.edit")),
):
    config = await mapping.upsert_provider(payload, user.id)
    return ok(MapProviderConfigRead.model_validate(config).model_dump(mode="json"))


@router.delete("/providers/{provider_type}")
async def delete_provider(
    provider_type: str,
    mapping: MappingService = Depends(get_mapping_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("mapping.edit")),
):
    await mapping.delete_provider(provider_type, user.id)
    return ok({"deleted": True})
