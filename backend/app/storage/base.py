from typing import Protocol


class StorageAdapter(Protocol):
    """Infrastructure interface (ARCHITECTURE.md) — `local_storage.py` backs dev/tests,
    `r2_storage.py` backs prod. `MediaService` only ever depends on this Protocol."""

    async def save(self, key: str, content: bytes, content_type: str) -> str:
        """Persists `content` under `key` and returns its public URL."""
        ...

    async def delete(self, key: str) -> None: ...
