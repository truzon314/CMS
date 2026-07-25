import uuid
from datetime import datetime
from typing import Protocol

from app.models.audit_log import AuditLog


class AuditLogRepository(Protocol):
    async def create(self, entry: AuditLog) -> AuditLog: ...

    async def list(
        self,
        *,
        page: int,
        per_page: int,
        user_id: uuid.UUID | None = None,
        action: str | None = None,
        entity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[AuditLog], int]: ...

    async def list_all_matching(
        self,
        *,
        user_id: uuid.UUID | None = None,
        action: str | None = None,
        entity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> list[AuditLog]: ...
