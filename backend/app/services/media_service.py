import io
import uuid

from PIL import Image

from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.domain.repositories.media_folder_repository import MediaFolderRepository
from app.domain.repositories.media_repository import MediaRepository
from app.domain.repositories.media_usage_repository import MediaUsageRepository
from app.models.media import Media
from app.models.media_folder import MediaFolder
from app.models.media_usage import MediaUsageEntityType
from app.schemas.media import MediaFolderCreate, MediaFolderUpdate, MediaUpdate
from app.services.audit_service import AuditService
from app.services.media_validation import is_image, sanitize_svg, validate_upload
from app.storage.base import StorageAdapter

_EXTENSION_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/zip": ".zip",
}


class MediaService:
    def __init__(
        self,
        media: MediaRepository,
        folders: MediaFolderRepository,
        usage: MediaUsageRepository,
        storage: StorageAdapter,
        audit: AuditService,
    ):
        self.media = media
        self.folders = folders
        self.usage = usage
        self.storage = storage
        self.audit = audit

    async def list_media(
        self,
        *,
        page: int,
        per_page: int,
        folder_id: uuid.UUID | None,
        mime_type: str | None,
        search: str | None,
    ) -> tuple[list[Media], int]:
        return await self.media.list(
            page=page, per_page=per_page, folder_id=folder_id, mime_type=mime_type, search=search
        )

    async def get(self, media_id: uuid.UUID) -> Media:
        media = await self.media.get_by_id(media_id)
        if not media:
            raise NotFoundError("Media not found.")
        return media

    async def upload(
        self, files: list[tuple[str, bytes]], folder_id: uuid.UUID | None, user_id: uuid.UUID
    ) -> list[Media]:
        created: list[Media] = []
        for file_name, content in files:
            mime_type = validate_upload(file_name, content)
            if mime_type == "image/svg+xml":
                content = sanitize_svg(content)

            width, height = self._read_dimensions(content, mime_type)
            key = f"{uuid.uuid4()}{_EXTENSION_BY_MIME[mime_type]}"
            url = await self.storage.save(key, content, mime_type)

            created.append(
                Media(
                    file_name=file_name,
                    file_key=key,
                    url=url,
                    mime_type=mime_type,
                    size_bytes=len(content),
                    width=width,
                    height=height,
                    folder_id=folder_id,
                    uploaded_by=user_id,
                )
            )

        rows = await self.media.create_many(created)
        for row in rows:
            await self.audit.log(user_id, "media.upload", "media", row.id, details={"file_name": row.file_name})
        return rows

    async def update(self, media_id: uuid.UUID, payload: MediaUpdate, actor_id: uuid.UUID | None = None) -> Media:
        media = await self.get(media_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(media, field, value)
        media = await self.media.update(media)
        await self.audit.log(actor_id, "media.update", "media", media.id)
        return media

    async def delete(self, media_id: uuid.UUID, force: bool, actor_id: uuid.UUID | None = None) -> None:
        media = await self.get(media_id)
        usages = await self.usage.list_for_media(media_id)
        if usages and not force:
            raise ConflictError(
                f"This file is used in {len(usages)} place(s). Delete anyway with ?force=true.",
                details={"usage_count": len(usages)},
            )
        await self.media.soft_delete(media)
        await self.audit.log(actor_id, "media.delete", "media", media.id, details={"file_name": media.file_name})

    async def restore(self, media_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> Media:
        media = await self.media.get_by_id(media_id, include_deleted=True)
        if not media:
            raise NotFoundError("Media not found.")
        await self.media.restore(media)
        await self.audit.log(actor_id, "media.restore", "media", media.id, details={"file_name": media.file_name})
        return await self.get(media_id)

    async def get_usage(self, media_id: uuid.UUID):
        await self.get(media_id)
        return await self.usage.list_for_media(media_id)

    async def sync_field_usage(
        self,
        entity_type: MediaUsageEntityType,
        entity_id: uuid.UUID,
        field_name: str,
        media_id: uuid.UUID | None,
    ) -> None:
        """Called whenever a content field that references a `Media` row is
        saved (e.g. a Hero Banner block's background image) — keeps
        `MediaUsage` in sync so the delete-with-usage-warning check is real."""
        if media_id is None:
            await self.usage.delete_for_field(entity_type, entity_id, field_name)
        else:
            await self.usage.upsert(entity_type, entity_id, field_name, media_id)

    async def list_folders(self) -> list[MediaFolder]:
        return await self.folders.list_all()

    async def create_folder(self, payload: MediaFolderCreate, actor_id: uuid.UUID | None = None) -> MediaFolder:
        folder = MediaFolder(name=payload.name, parent_folder_id=payload.parent_folder_id)
        folder = await self.folders.create(folder)
        await self.audit.log(actor_id, "media.create_folder", "media_folder", folder.id, details={"name": folder.name})
        return folder

    async def update_folder(
        self, folder_id: uuid.UUID, payload: MediaFolderUpdate, actor_id: uuid.UUID | None = None
    ) -> MediaFolder:
        folder = await self.folders.get_by_id(folder_id)
        if not folder:
            raise NotFoundError("Folder not found.")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(folder, field, value)
        folder = await self.folders.update(folder)
        await self.audit.log(actor_id, "media.update_folder", "media_folder", folder.id)
        return folder

    async def delete_folder(self, folder_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> None:
        folder = await self.folders.get_by_id(folder_id)
        if not folder:
            raise NotFoundError("Folder not found.")
        if await self.folders.count_children(folder_id) > 0:
            raise ConflictError("This folder has subfolders — move or delete them first.")
        if await self.media.count_in_folder(folder_id) > 0:
            raise ConflictError("This folder has files in it — move or delete them first.")
        await self.folders.delete(folder)
        await self.audit.log(actor_id, "media.delete_folder", "media_folder", folder_id, details={"name": folder.name})

    @staticmethod
    def _read_dimensions(content: bytes, mime_type: str) -> tuple[int | None, int | None]:
        if not is_image(mime_type) or mime_type == "image/svg+xml":
            return None, None
        try:
            with Image.open(io.BytesIO(content)) as img:
                return img.width, img.height
        except Exception as exc:
            raise ValidationAppError("Uploaded image data is corrupt or unreadable.") from exc
