import uuid

from pydantic import BaseModel, ConfigDict

from app.schemas.permission import PermissionRead


class RoleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    description: str | None = None


class RoleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    description: str | None = None


class RolePermissionsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    permission_ids: list[uuid.UUID]


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    is_system: bool
    permissions: list[PermissionRead] = []
