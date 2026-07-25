import uuid

from pydantic import BaseModel, ConfigDict


class SeoMetaInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    seo_title: str | None = None
    meta_description: str | None = None
    keywords: list[str] | None = None
    canonical_url: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image_media_id: uuid.UUID | None = None
    twitter_card_type: str | None = None
    robots: str | None = None
    schema_jsonld: dict | None = None


class SeoMetaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    seo_title: str | None
    meta_description: str | None
    keywords: list[str] | None
    canonical_url: str | None
    og_title: str | None
    og_description: str | None
    og_image_media_id: uuid.UUID | None
    twitter_card_type: str | None
    robots: str | None
    schema_jsonld: dict | None
