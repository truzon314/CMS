from app.domain.repositories.permission_repository import PermissionRepository
from app.models.permission import Permission


class PermissionService:
    def __init__(self, permissions: PermissionRepository):
        self.permissions = permissions

    async def list(self) -> list[Permission]:
        return await self.permissions.list()
