import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.domain.repositories.permission_repository import PermissionRepository
from app.domain.repositories.role_repository import RoleRepository
from app.models.role import Role
from app.models.user import User
from app.schemas.role import RoleCreate, RoleUpdate
from app.services.audit_service import AuditService

SYSTEM_ROLE_ERROR = "System roles can't be edited or deleted."


class RoleService:
    def __init__(
        self, roles: RoleRepository, permissions: PermissionRepository, session: AsyncSession, audit: AuditService
    ):
        self.roles = roles
        self.permissions = permissions
        self.session = session
        self.audit = audit

    async def list(self) -> list[Role]:
        return await self.roles.list()

    async def get(self, role_id: uuid.UUID) -> Role:
        role = await self.roles.get_by_id(role_id)
        if not role:
            raise NotFoundError("Role not found.")
        return role

    async def create(self, payload: RoleCreate, actor_id: uuid.UUID | None = None) -> Role:
        if await self.roles.get_by_name(payload.name):
            raise ConflictError("A role with that name already exists.")
        role = Role(name=payload.name, description=payload.description, is_system=False)
        role = await self.roles.create(role)
        await self.audit.log(actor_id, "role.create", "role", role.id, details={"name": role.name})
        return role

    async def update(self, role_id: uuid.UUID, payload: RoleUpdate, actor_id: uuid.UUID | None = None) -> Role:
        role = await self.get(role_id)
        if role.is_system:
            raise ForbiddenError(SYSTEM_ROLE_ERROR)

        if payload.name is not None:
            role.name = payload.name
        if payload.description is not None:
            role.description = payload.description

        role = await self.roles.update(role)
        await self.audit.log(actor_id, "role.update", "role", role.id)
        return role

    async def update_permissions(
        self, role_id: uuid.UUID, permission_ids: list[uuid.UUID], actor_id: uuid.UUID | None = None
    ) -> Role:
        role = await self.get(role_id)
        if role.is_system:
            raise ForbiddenError(SYSTEM_ROLE_ERROR)

        role.permissions = await self.permissions.get_by_ids(permission_ids)
        role = await self.roles.update(role)
        await self.audit.log(actor_id, "role.update_permissions", "role", role.id)
        return role

    async def delete(self, role_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> None:
        role = await self.get(role_id)
        if role.is_system:
            raise ForbiddenError(SYSTEM_ROLE_ERROR)

        count_stmt = select(func.count()).select_from(User).where(User.role_id == role_id)
        assigned_users = (await self.session.execute(count_stmt)).scalar_one()
        if assigned_users > 0:
            raise ConflictError(
                f"{assigned_users} user(s) still have this role — reassign them first."
            )

        await self.roles.delete(role)
        await self.audit.log(actor_id, "role.delete", "role", role_id, details={"name": role.name})
