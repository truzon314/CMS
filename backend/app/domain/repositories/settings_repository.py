import uuid
from typing import Any, Protocol

from app.models.setting import Setting


class SettingsRepository(Protocol):
    async def get_all(self) -> list[Setting]: ...
    async def upsert(self, key: str, value: Any, updated_by: uuid.UUID) -> Setting: ...
