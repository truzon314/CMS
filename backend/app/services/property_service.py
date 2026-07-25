import uuid

from app.shared.exceptions.exceptions import ConflictError, NotFoundError
from app.domain.repositories.category_repository import CategoryRepository
from app.domain.repositories.media_usage_repository import MediaUsageRepository
from app.domain.repositories.property_repository import PropertyRepository
from app.models.media_usage import MediaUsageEntityType
from app.models.property import Property, PropertyStatus
from app.schemas.property import PropertyCreate, PropertyGalleryRequest, PropertyUpdate
from app.services.audit_service import AuditService

_FEATURED_IMAGE_FIELD = "featured_image"


class PropertyService:
    def __init__(
        self,
        properties: PropertyRepository,
        categories: CategoryRepository,
        media_usage: MediaUsageRepository,
        audit: AuditService,
    ):
        self.properties = properties
        self.categories = categories
        self.media_usage = media_usage
        self.audit = audit

    async def list_properties(
        self,
        *,
        page: int,
        per_page: int,
        status: str | None,
        city: str | None,
        category_id: uuid.UUID | None,
        budget_bracket: str | None,
        search: str | None,
    ) -> tuple[list[Property], int]:
        return await self.properties.list(
            page=page, per_page=per_page, status=status, city=city, category_id=category_id,
            budget_bracket=budget_bracket, search=search,
        )

    async def get(self, property_id: uuid.UUID) -> Property:
        property_ = await self.properties.get_by_id(property_id)
        if not property_:
            raise NotFoundError("Property not found.")
        return property_

    async def create(self, payload: PropertyCreate, actor_id: uuid.UUID | None = None) -> Property:
        if await self.properties.get_by_slug(payload.slug):
            raise ConflictError(f"Slug '{payload.slug}' is already in use.")

        data = payload.model_dump(exclude={"category_ids"})
        property_ = Property(**data)
        property_.categories = await self.categories.list_by_ids(payload.category_ids)
        property_ = await self.properties.create(property_)
        await self._sync_featured_image_usage(property_)
        await self.audit.log(actor_id, "property.create", "property", property_.id, details={"name": property_.name})
        return property_

    async def update(
        self, property_id: uuid.UUID, payload: PropertyUpdate, actor_id: uuid.UUID | None = None
    ) -> Property:
        property_ = await self.get(property_id)
        data = payload.model_dump(exclude_unset=True, exclude={"category_ids", "seo"})

        if "slug" in data and data["slug"] != property_.slug:
            existing = await self.properties.get_by_slug(data["slug"])
            if existing and existing.id != property_.id:
                raise ConflictError(f"Slug '{data['slug']}' is already in use.")

        for field, value in data.items():
            setattr(property_, field, value)

        if payload.category_ids is not None:
            property_.categories = await self.categories.list_by_ids(payload.category_ids)

        property_ = await self.properties.update(property_)
        await self._sync_featured_image_usage(property_)

        if payload.seo is not None:
            seo_data = payload.seo.model_dump(exclude_unset=True)
            property_ = await self.properties.upsert_seo(property_, seo_data)

        await self.audit.log(actor_id, "property.update", "property", property_.id)
        return property_

    async def duplicate(self, property_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> Property:
        original = await self.get(property_id)
        slug = f"{original.slug}-copy"
        suffix = 2
        while await self.properties.get_by_slug(slug):
            slug = f"{original.slug}-copy-{suffix}"
            suffix += 1

        copy = Property(
            name=f"{original.name} (Copy)",
            slug=slug,
            city=original.city,
            location_text=original.location_text,
            price_display=original.price_display,
            price_value=original.price_value,
            budget_bracket=original.budget_bracket,
            spec_a=original.spec_a,
            spec_b=original.spec_b,
            area_sqft=original.area_sqft,
            beds_options=original.beds_options,
            tag_text=original.tag_text,
            status_text=original.status_text,
            is_signature=False,
            featured_image_media_id=original.featured_image_media_id,
            status=PropertyStatus.DRAFT,
        )
        copy.categories = list(original.categories)
        copy = await self.properties.create(copy)
        copy = await self.properties.set_gallery(copy.id, [pm.media_id for pm in original.gallery])
        await self.audit.log(actor_id, "property.duplicate", "property", copy.id, details={"name": copy.name})
        return copy

    async def soft_delete(self, property_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> None:
        property_ = await self.get(property_id)
        await self.properties.soft_delete(property_)
        await self.audit.log(actor_id, "property.delete", "property", property_.id, details={"name": property_.name})

    async def restore(self, property_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> Property:
        property_ = await self.properties.get_by_id(property_id, include_deleted=True)
        if not property_:
            raise NotFoundError("Property not found.")
        await self.properties.restore(property_)
        await self.audit.log(actor_id, "property.restore", "property", property_.id, details={"name": property_.name})
        return await self.get(property_id)

    async def publish(self, property_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> Property:
        property_ = await self.get(property_id)
        property_.status = PropertyStatus.PUBLISHED
        property_ = await self.properties.update(property_)
        await self.audit.log(actor_id, "property.publish", "property", property_.id)
        return property_

    async def unpublish(self, property_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> Property:
        property_ = await self.get(property_id)
        property_.status = PropertyStatus.DRAFT
        property_ = await self.properties.update(property_)
        await self.audit.log(actor_id, "property.unpublish", "property", property_.id)
        return property_

    async def set_gallery(
        self, property_id: uuid.UUID, payload: PropertyGalleryRequest, actor_id: uuid.UUID | None = None
    ) -> Property:
        await self.get(property_id)
        result = await self.properties.set_gallery(property_id, payload.media_ids)
        await self.audit.log(actor_id, "property.set_gallery", "property", property_id)
        return result

    async def _sync_featured_image_usage(self, property_: Property) -> None:
        if property_.featured_image_media_id:
            await self.media_usage.upsert(
                MediaUsageEntityType.PROPERTY, property_.id, _FEATURED_IMAGE_FIELD, property_.featured_image_media_id
            )
        else:
            await self.media_usage.delete_for_field(MediaUsageEntityType.PROPERTY, property_.id, _FEATURED_IMAGE_FIELD)
