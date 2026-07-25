import uuid
from typing import Protocol

from app.models.block_definition import BlockDefinition


class BlockDefinitionRepository(Protocol):
    async def list(self) -> list[BlockDefinition]: ...
    async def get_by_id(self, definition_id: uuid.UUID) -> BlockDefinition | None: ...
