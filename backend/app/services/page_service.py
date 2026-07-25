import uuid
from datetime import datetime, timezone

from pydantic import ValidationError

from app.core.exceptions import NotFoundError, ValidationAppError
from app.domain.repositories.block_definition_repository import BlockDefinitionRepository
from app.domain.repositories.entity_version_repository import EntityVersionRepository
from app.domain.repositories.media_usage_repository import MediaUsageRepository
from app.domain.repositories.page_repository import PageRepository
from app.models.entity_version import EntityType, EntityVersion
from app.models.media_usage import MediaUsageEntityType
from app.models.page import Page, PageStatus, PageType
from app.models.page_block import PageBlock
from app.schemas.block_configs import MEDIA_ID_FIELDS, validate_block_config
from app.schemas.page import BlockDefinitionRead, PageBlockCreate, PageBlockUpdate, PageUpdate
from app.services.audit_service import AuditService


class PageService:
    def __init__(
        self,
        pages: PageRepository,
        block_definitions: BlockDefinitionRepository,
        versions: EntityVersionRepository,
        media_usage: MediaUsageRepository,
        audit: AuditService,
    ):
        self.pages = pages
        self.block_definitions = block_definitions
        self.versions = versions
        self.media_usage = media_usage
        self.audit = audit

    async def list_pages(self) -> list[Page]:
        return await self.pages.list_all()

    async def get(self, page_type: PageType) -> Page:
        page = await self.pages.get_by_type(page_type)
        if not page:
            raise NotFoundError("Page not found.")
        return page

    async def list_block_definitions(self) -> list[BlockDefinitionRead]:
        definitions = await self.block_definitions.list()
        return [BlockDefinitionRead.model_validate(d) for d in definitions]

    async def update(self, page_type: PageType, payload: PageUpdate, user_id: uuid.UUID) -> Page:
        page = await self.get(page_type)
        if payload.title is not None:
            page.title = payload.title
        page.updated_by = user_id
        page = await self.pages.update(page)

        if payload.seo is not None:
            seo_data = payload.seo.model_dump(exclude_unset=True)
            page = await self.pages.upsert_seo(page, seo_data)

        await self._snapshot(page, user_id, "Updated page details")
        return page

    async def publish(self, page_type: PageType, user_id: uuid.UUID) -> Page:
        page = await self.get(page_type)
        page.status = PageStatus.PUBLISHED
        page.published_at = datetime.now(timezone.utc)
        page.scheduled_at = None
        page.updated_by = user_id
        page = await self.pages.update(page)
        await self._snapshot(page, user_id, "Published")
        return page

    async def unpublish(self, page_type: PageType, user_id: uuid.UUID) -> Page:
        page = await self.get(page_type)
        page.status = PageStatus.UNPUBLISHED
        page.updated_by = user_id
        page = await self.pages.update(page)
        await self._snapshot(page, user_id, "Unpublished")
        return page

    async def schedule(self, page_type: PageType, scheduled_at: datetime, user_id: uuid.UUID) -> Page:
        page = await self.get(page_type)
        page.status = PageStatus.SCHEDULED
        page.scheduled_at = scheduled_at
        page.updated_by = user_id
        page = await self.pages.update(page)
        await self._snapshot(page, user_id, f"Scheduled for {scheduled_at.isoformat()}")
        return page

    async def add_block(self, page_type: PageType, payload: PageBlockCreate, user_id: uuid.UUID) -> Page:
        page = await self.get(page_type)
        definition = await self.block_definitions.get_by_id(payload.block_definition_id)
        if not definition:
            raise NotFoundError("Block type not found.")

        config = self._validate_config(definition.key, payload.config)
        position = payload.position
        if position is None:
            position = (await self.pages.max_block_position(page.id)) + 1

        block = PageBlock(
            page_id=page.id, block_definition_id=definition.id, position=position, config=config
        )
        block = await self.pages.add_block(block)
        await self._sync_block_media_usage(page.id, block.id, definition.key, config)
        page = await self.get(page_type)
        await self._snapshot(page, user_id, f"Added {definition.label} block")
        return page

    async def update_block(
        self, page_type: PageType, block_id: uuid.UUID, payload: PageBlockUpdate, user_id: uuid.UUID
    ) -> Page:
        page = await self.get(page_type)
        block = await self._get_page_block(page, block_id)
        config = self._validate_config(block.block_definition.key, payload.config)
        block.config = config
        await self.pages.update_block(block)
        await self._sync_block_media_usage(page.id, block.id, block.block_definition.key, config)
        page = await self.get(page_type)
        await self._snapshot(page, user_id, "Edited a block")
        return page

    async def delete_block(self, page_type: PageType, block_id: uuid.UUID, user_id: uuid.UUID) -> Page:
        page = await self.get(page_type)
        block = await self._get_page_block(page, block_id)
        await self._clear_block_media_usage(page.id, block.id)
        await self.pages.delete_block(block)
        page = await self.get(page_type)
        await self._snapshot(page, user_id, "Removed a block")
        return page

    async def reorder_blocks(self, page_type: PageType, ordered_ids: list[uuid.UUID], user_id: uuid.UUID) -> Page:
        page = await self.get(page_type)
        await self.pages.reorder_blocks(page.id, ordered_ids)
        page = await self.get(page_type)
        await self._snapshot(page, user_id, "Reordered blocks")
        return page

    async def list_versions(self, page_type: PageType) -> list[EntityVersion]:
        page = await self.get(page_type)
        return await self.versions.list_for_entity(EntityType.PAGE, page.id)

    async def restore_version(self, page_type: PageType, version_id: uuid.UUID, user_id: uuid.UUID) -> Page:
        page = await self.get(page_type)
        version = await self.versions.get_by_id(version_id)
        if not version or version.entity_id != page.id:
            raise NotFoundError("Version not found.")

        snapshot = version.snapshot
        page.title = snapshot["title"]

        for block in list(page.blocks):
            await self._clear_block_media_usage(page.id, block.id)
            await self.pages.delete_block(block)

        for block_data in snapshot["blocks"]:
            definition_id = uuid.UUID(block_data["block_definition_id"])
            new_block = await self.pages.add_block(
                PageBlock(
                    page_id=page.id,
                    block_definition_id=definition_id,
                    position=block_data["position"],
                    config=block_data["config"],
                )
            )
            definition = await self.block_definitions.get_by_id(definition_id)
            if definition:
                await self._sync_block_media_usage(page.id, new_block.id, definition.key, block_data["config"])

        page.updated_by = user_id
        page = await self.pages.update(page)
        await self._snapshot(page, user_id, f"Restored version {version.version_number}")
        return page

    async def _sync_block_media_usage(
        self, page_id: uuid.UUID, block_id: uuid.UUID, block_key: str, config: dict
    ) -> None:
        field = MEDIA_ID_FIELDS.get(block_key)
        if not field:
            return
        raw_media_id = config.get(field)
        field_name = f"block:{block_id}"
        if raw_media_id:
            await self.media_usage.upsert(MediaUsageEntityType.PAGE, page_id, field_name, uuid.UUID(raw_media_id))
        else:
            await self.media_usage.delete_for_field(MediaUsageEntityType.PAGE, page_id, field_name)

    async def _clear_block_media_usage(self, page_id: uuid.UUID, block_id: uuid.UUID) -> None:
        await self.media_usage.delete_for_field(MediaUsageEntityType.PAGE, page_id, f"block:{block_id}")

    def _validate_config(self, block_key: str, config: dict) -> dict:
        try:
            return validate_block_config(block_key, config)
        except ValidationError as exc:
            raise ValidationAppError("Invalid block content.", details={"errors": exc.errors()}) from exc

    async def _get_page_block(self, page: Page, block_id: uuid.UUID) -> PageBlock:
        block = await self.pages.get_block(block_id)
        if not block or block.page_id != page.id:
            raise NotFoundError("Block not found.")
        return block

    async def _snapshot(self, page: Page, user_id: uuid.UUID, note: str) -> None:
        version_number = await self.versions.next_version_number(EntityType.PAGE, page.id)
        snapshot = {
            "title": page.title,
            "blocks": [
                {
                    "block_definition_id": str(b.block_definition_id),
                    "position": b.position,
                    "config": b.config,
                }
                for b in sorted(page.blocks, key=lambda b: b.position)
            ],
        }
        version = EntityVersion(
            entity_type=EntityType.PAGE,
            entity_id=page.id,
            version_number=version_number,
            snapshot=snapshot,
            change_note=note,
            created_by=user_id,
        )
        await self.versions.create(version)
        await self.audit.log(user_id, f"page.{note}", "page", page.id, details={"page_type": page.page_type.value})
