"""Unit tests for RoleService business rules — fake in-memory repos, no DB
(ROADMAP.md Phase 8: "no DB needed, that's the point of the layering")."""

import uuid

import pytest

from app.shared.exceptions.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate
from app.services.audit_service import AuditService
from app.services.role_service import RoleService


class FakeAuditLogRepository:
    def __init__(self):
        self.entries = []

    async def create(self, entry):
        self.entries.append(entry)
        return entry


class FakeRoleRepository:
    def __init__(self, roles=None):
        self._roles = {r.id: r for r in (roles or [])}

    async def list(self):
        return list(self._roles.values())

    async def get_by_id(self, role_id):
        return self._roles.get(role_id)

    async def get_by_name(self, name):
        return next((r for r in self._roles.values() if r.name == name), None)

    async def create(self, role):
        role.id = role.id or uuid.uuid4()
        self._roles[role.id] = role
        return role

    async def update(self, role):
        return role

    async def delete(self, role):
        del self._roles[role.id]


class FakePermissionRepository:
    async def get_by_ids(self, ids):
        return []


class FakeSession:
    async def execute(self, stmt):
        class _Result:
            def scalar_one(self_inner):
                return 0

        return _Result()


def make_service(roles=None):
    audit = AuditService(FakeAuditLogRepository())
    return RoleService(FakeRoleRepository(roles), FakePermissionRepository(), FakeSession(), audit)


@pytest.mark.asyncio
async def test_system_role_cannot_be_updated():
    system_role = Role(id=uuid.uuid4(), name="Super Admin", is_system=True)
    service = make_service([system_role])

    with pytest.raises(ForbiddenError):
        await service.update(system_role.id, RoleUpdate(name="Renamed"))


@pytest.mark.asyncio
async def test_system_role_cannot_be_deleted():
    system_role = Role(id=uuid.uuid4(), name="Super Admin", is_system=True)
    service = make_service([system_role])

    with pytest.raises(ForbiddenError):
        await service.delete(system_role.id)


@pytest.mark.asyncio
async def test_duplicate_role_name_rejected():
    existing = Role(id=uuid.uuid4(), name="Editor", is_system=False)
    service = make_service([existing])

    with pytest.raises(ConflictError):
        await service.create(RoleCreate(name="Editor", description=None))


@pytest.mark.asyncio
async def test_get_missing_role_raises_not_found():
    service = make_service([])

    with pytest.raises(NotFoundError):
        await service.get(uuid.uuid4())


@pytest.mark.asyncio
async def test_create_role_writes_audit_log():
    audit_repo = FakeAuditLogRepository()
    service = RoleService(FakeRoleRepository([]), FakePermissionRepository(), FakeSession(), AuditService(audit_repo))
    actor_id = uuid.uuid4()

    role = await service.create(RoleCreate(name="Marketing", description=None), actor_id)

    assert len(audit_repo.entries) == 1
    assert audit_repo.entries[0].action == "role.create"
    assert audit_repo.entries[0].entity_id == role.id
    assert audit_repo.entries[0].user_id == actor_id
