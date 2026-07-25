import json
import uuid

from pydantic import BaseModel, ConfigDict, field_validator


_ROBOT_DIRECTIVES = {"index", "noindex", "follow", "nofollow"}


def _validate_robots(value: str | None) -> str | None:
    if value is None:
        return value
    directives = {directive.strip().lower() for directive in value.split(",") if directive.strip()}
    if not directives or not directives <= _ROBOT_DIRECTIVES:
        raise ValueError("Robots must only contain index/noindex and follow/nofollow directives.")
    if {"index", "noindex"} <= directives or {"follow", "nofollow"} <= directives:
        raise ValueError("Robots cannot contain contradictory directives.")
    return ",".join(directive for directive in ("index", "noindex", "follow", "nofollow") if directive in directives)


class SeoMetaInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    seo_title: str | None = None
    meta_description: str | None = None
    focus_keyword: str | None = None
    keywords: list[str] | None = None
    canonical_url: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image_media_id: uuid.UUID | None = None
    twitter_card_type: str | None = None
    twitter_title: str | None = None
    twitter_description: str | None = None
    twitter_image_media_id: uuid.UUID | None = None
    robots: str | None = None
    schema_jsonld: dict | None = None

    @field_validator("seo_title", "og_title", "twitter_title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is not None and len(value.strip()) > 255:
            raise ValueError("SEO titles must be 255 characters or fewer.")
        return value.strip() if value else None

    @field_validator("meta_description", "og_description", "twitter_description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        if value is not None and len(value.strip()) > 500:
            raise ValueError("SEO descriptions must be 500 characters or fewer.")
        return value.strip() if value else None

    @field_validator("canonical_url")
    @classmethod
    def validate_canonical_url(cls, value: str | None) -> str | None:
        if value and not (value.startswith("https://") or value.startswith("http://") or value.startswith("/")):
            raise ValueError("Canonical URL must be an absolute URL or a site-relative path.")
        return value or None

    @field_validator("twitter_card_type")
    @classmethod
    def validate_twitter_card(cls, value: str | None) -> str | None:
        if value and value not in {"summary", "summary_large_image"}:
            raise ValueError("Twitter card must be summary or summary_large_image.")
        return value or None

    @field_validator("robots")
    @classmethod
    def validate_robots(cls, value: str | None) -> str | None:
        return _validate_robots(value)

    @field_validator("schema_jsonld")
    @classmethod
    def validate_schema(cls, value: dict | None) -> dict | None:
        if value is not None:
            try:
                json.dumps(value)
            except (TypeError, ValueError) as exc:
                raise ValueError("Schema must be JSON serializable.") from exc
        return value


class SeoMetaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    seo_title: str | None
    meta_description: str | None
    focus_keyword: str | None
    keywords: list[str] | None
    canonical_url: str | None
    og_title: str | None
    og_description: str | None
    og_image_media_id: uuid.UUID | None
    twitter_card_type: str | None
    twitter_title: str | None
    twitter_description: str | None
    twitter_image_media_id: uuid.UUID | None
    robots: str | None
    schema_jsonld: dict | None
