import uuid

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.models.user import User
from app.schemas.settings import SettingsUpdate
from app.schemas.version import EntityVersionRead
from app.services.settings_service import SettingsService
from app.shared.dependencies.container import get_settings_service
from app.shared.utils.common import ok

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
async def get_settings(
    settings_service: SettingsService = Depends(get_settings_service),
    _=Depends(require_permission("settings.manage")),
):
    settings = await settings_service.get_all()
    return ok(settings.model_dump(mode="json"))


@router.put("")
async def update_settings(
    payload: SettingsUpdate,
    settings_service: SettingsService = Depends(get_settings_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("settings.manage")),
):
    settings = await settings_service.update(payload, user.id)
    return ok(settings.model_dump(mode="json"))


@router.get("/versions")
async def list_settings_versions(
    settings_service: SettingsService = Depends(get_settings_service),
    _=Depends(require_permission("settings.manage")),
):
    versions = await settings_service.list_versions()
    return ok([EntityVersionRead.model_validate(v).model_dump(mode="json") for v in versions])


@router.post("/versions/{version_id}/restore")
async def restore_settings_version(
    version_id: uuid.UUID,
    settings_service: SettingsService = Depends(get_settings_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("settings.manage")),
):
    settings = await settings_service.restore_version(version_id, user.id)
    return ok(settings.model_dump(mode="json"))
