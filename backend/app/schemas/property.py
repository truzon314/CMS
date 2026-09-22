from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.property import BudgetBracket, PropertyStatus
from app.schemas.seo import SeoMetaInput, SeoMetaRead
from app.schemas.taxonomy import CategoryRead
from app.schemas.validators import Slug


class PropertyMediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    media_id: str
    position: int


class PropertyAmenity(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    image_media_id: str | None = None


class PropertyListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    city: str | None
    category_names: list[str]
    price_display: str | None
    status: PropertyStatus
    sort_order: int
    updated_at: datetime


class PropertyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    city: str | None
    location_text: str | None
    price_display: str | None
    price_value: Decimal | None
    budget_bracket: BudgetBracket | None
    spec_a: str | None
    spec_b: str | None
    area_sqft: Decimal | None
    beds_options: list | None
    description: str | None
    amenities: list[PropertyAmenity] | None
    tag_text: str | None
    status_text: str | None
    is_signature: bool
    featured_image_media_id: str | None
    brochure_media_id: str | None
    map_project_id: str | None
    seo: SeoMetaRead | None
    status: PropertyStatus
    sort_order: int
    categories: list[CategoryRead]
    gallery: list[PropertyMediaRead]
    created_at: datetime
    updated_at: datetime


class PropertyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    slug: Slug
    city: str | None = None
    location_text: str | None = None
    price_display: str | None = None
    price_value: Decimal | None = None
    budget_bracket: BudgetBracket | None = None
    spec_a: str | None = None
    spec_b: str | None = None
    area_sqft: Decimal | None = None
    beds_options: list[str] = []
    description: str | None = None
    amenities: list[PropertyAmenity] | None = None
    tag_text: str | None = None
    status_text: str | None = None
    is_signature: bool = False
    featured_image_media_id: str | None = None
    brochure_media_id: str | None = None
    map_project_id: str | None = None
    category_ids: list[str] = []


class PropertyUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    slug: Slug | None = None
    city: str | None = None
    location_text: str | None = None
    price_display: str | None = None
    price_value: Decimal | None = None
    budget_bracket: BudgetBracket | None = None
    spec_a: str | None = None
    spec_b: str | None = None
    area_sqft: Decimal | None = None
    beds_options: list[str] | None = None
    description: str | None = None
    amenities: list[PropertyAmenity] | None = None
    tag_text: str | None = None
    status_text: str | None = None
    is_signature: bool | None = None
    featured_image_media_id: str | None = None
    brochure_media_id: str | None = None
    map_project_id: str | None = None
    category_ids: list[str] | None = None
    seo: SeoMetaInput | None = None


class PropertyGalleryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    media_ids: list[str]


class PropertiesReorderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order: list[str]
