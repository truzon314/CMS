import uuid
from typing import Protocol

from app.models.media_usage import MediaUsage, MediaUsageEntityType


class MediaUsageRepository(Protocol):
    async def list_for_media(self, media_id: uuid.UUID) -> list[MediaUsage]: ...

    async def get_for_field(
        self, entity_type: MediaUsageEntityType, entity_id: uuid.UUID, field_name: str
    ) -> MediaUsage | None: ...

    async def upsert(
        self, entity_type: MediaUsageEntityType, entity_id: uuid.UUID, field_name: str, media_id: uuid.UUID
    ) -> MediaUsage: ...

    async def delete_for_field(
        self, entity_type: MediaUsageEntityType, entity_id: uuid.UUID, field_name: str
    ) -> None: ...
