import uuid

from app.shared.exceptions.exceptions import NotFoundError
from app.domain.repositories.entity_version_repository import EntityVersionRepository
from app.domain.repositories.settings_repository import SettingsRepository
from app.models.entity_version import EntityType, EntityVersion
from app.schemas.settings import KNOWN_SETTING_KEYS, SettingsRead, SettingsUpdate
from app.services.audit_service import AuditService

# Settings is a single global document, not a per-row entity — `EntityVersion`
# still needs a stable entity_id, so every settings version snapshots against
# this fixed nil UUID rather than a real row id.
SETTINGS_ENTITY_ID = uuid.UUID(int=0)


class SettingsService:
    def __init__(self, settings: SettingsRepository, versions: EntityVersionRepository, audit: AuditService):
        self.settings = settings
        self.versions = versions
        self.audit = audit

    async def get_all(self) -> SettingsRead:
        rows = await self.settings.get_all()
        values = {row.key: row.value for row in rows if row.key in KNOWN_SETTING_KEYS}
        return SettingsRead(**values)

    async def update(self, payload: SettingsUpdate, user_id: uuid.UUID) -> SettingsRead:
        data = payload.model_dump(exclude_unset=True, mode="json")
        for key, value in data.items():
            await self.settings.upsert(key, value, user_id)

        result = await self.get_all()
        await self._snapshot(result, user_id, "Updated settings")
        return result

    async def list_versions(self) -> list[EntityVersion]:
        return await self.versions.list_for_entity(EntityType.SETTINGS, SETTINGS_ENTITY_ID)

    async def restore_version(self, version_id: uuid.UUID, user_id: uuid.UUID) -> SettingsRead:
        version = await self.versions.get_by_id(version_id)
        if not version or version.entity_id != SETTINGS_ENTITY_ID:
            raise NotFoundError("Version not found.")

        for key, value in version.snapshot.items():
            if key in KNOWN_SETTING_KEYS:
                await self.settings.upsert(key, value, user_id)

        result = await self.get_all()
        await self._snapshot(result, user_id, f"Restored version {version.version_number}")
        return result

    async def _snapshot(self, settings: SettingsRead, user_id: uuid.UUID, note: str) -> None:
        version_number = await self.versions.next_version_number(EntityType.SETTINGS, SETTINGS_ENTITY_ID)
        version = EntityVersion(
            entity_type=EntityType.SETTINGS,
            entity_id=SETTINGS_ENTITY_ID,
            version_number=version_number,
            snapshot=settings.model_dump(mode="json"),
            change_note=note,
            created_by=user_id,
        )
        await self.versions.create(version)
        await self.audit.log(user_id, f"settings.{note}", "settings", SETTINGS_ENTITY_ID)
