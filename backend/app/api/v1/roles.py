import uuid

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.core.container import get_permission_service, get_role_service
from app.models.user import User
from app.schemas.common import ok
from app.schemas.permission import PermissionRead
from app.schemas.role import RoleCreate, RolePermissionsUpdate, RoleRead, RoleUpdate
from app.services.permission_service import PermissionService
from app.services.role_service import RoleService

router = APIRouter(tags=["roles"])


@router.get("/roles")
async def list_roles(
    role_service: RoleService = Depends(get_role_service),
    _=Depends(require_permission("users.manage")),
):
    roles = await role_service.list()
    return ok([RoleRead.model_validate(r).model_dump(mode="json") for r in roles])


@router.post("/roles")
async def create_role(
    payload: RoleCreate,
    role_service: RoleService = Depends(get_role_service),
    actor: User = Depends(get_current_user),
    _=Depends(require_permission("users.manage")),
):
    role = await role_service.create(payload, actor.id)
    return ok(RoleRead.model_validate(role).model_dump(mode="json"))


@router.get("/roles/{role_id}")
async def get_role(
    role_id: uuid.UUID,
    role_service: RoleService = Depends(get_role_service),
    _=Depends(require_permission("users.manage")),
):
    role = await role_service.get(role_id)
    return ok(RoleRead.model_validate(role).model_dump(mode="json"))


@router.put("/roles/{role_id}")
async def update_role(
    role_id: uuid.UUID,
    payload: RoleUpdate,
    role_service: RoleService = Depends(get_role_service),
    actor: User = Depends(get_current_user),
    _=Depends(require_permission("users.manage")),
):
    role = await role_service.update(role_id, payload, actor.id)
    return ok(RoleRead.model_validate(role).model_dump(mode="json"))


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: uuid.UUID,
    role_service: RoleService = Depends(get_role_service),
    actor: User = Depends(get_current_user),
    _=Depends(require_permission("users.manage")),
):
    await role_service.delete(role_id, actor.id)
    return ok({"deleted": True})


@router.put("/roles/{role_id}/permissions")
async def update_role_permissions(
    role_id: uuid.UUID,
    payload: RolePermissionsUpdate,
    role_service: RoleService = Depends(get_role_service),
    actor: User = Depends(get_current_user),
    _=Depends(require_permission("users.manage")),
):
    role = await role_service.update_permissions(role_id, payload.permission_ids, actor.id)
    return ok(RoleRead.model_validate(role).model_dump(mode="json"))


@router.get("/permissions")
async def list_permissions(
    permission_service: PermissionService = Depends(get_permission_service),
    _=Depends(require_permission("users.manage")),
):
    permissions = await permission_service.list()
    return ok([PermissionRead.model_validate(p).model_dump(mode="json") for p in permissions])
