import asyncio
from pathlib import Path

from app.core.config import get_settings


class LocalStorageAdapter:
    """Dev/tests implementation of `StorageAdapter` — writes to disk under
    `settings.media_storage_dir` and serves back through the `/media-files/{key}`
    route (see `api/v1/media.py`), not through this class."""

    def __init__(self) -> None:
        settings = get_settings()
        self._root = Path(settings.media_storage_dir)
        self._base_url = settings.public_media_base_url.rstrip("/")

    async def save(self, key: str, content: bytes, content_type: str) -> str:
        path = self._root / key
        await asyncio.to_thread(self._write, path, content)
        return f"{self._base_url}/media-files/{key}"

    async def delete(self, key: str) -> None:
        path = self._root / key
        await asyncio.to_thread(path.unlink, True)

    @staticmethod
    def _write(path: Path, content: bytes) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
