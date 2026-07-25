import uuid
from typing import Protocol

from app.models.permission import Permission


class PermissionRepository(Protocol):
    async def list(self) -> list[Permission]: ...
    async def get_by_ids(self, ids: list[uuid.UUID]) -> list[Permission]: ...
