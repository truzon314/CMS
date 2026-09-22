from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.seo import SeoMetaInput, SeoMetaRead


class BlockDefinitionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    label: str
    is_active: bool


class PageBlockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    block_definition_id: str
    position: int
    config: dict


class PageBlockCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    block_definition_id: str
    position: int | None = None
    config: dict = {}


class PageBlockUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    config: dict


class BlocksReorderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order: list[str]


class PageUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = None
    seo: SeoMetaInput | None = None


class ScheduleRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scheduled_at: datetime


class PageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    page_type: str
    slug: str
    title: str
    status: str
    published_at: datetime | None
    scheduled_at: datetime | None
    seo: SeoMetaRead | None
    blocks: list[PageBlockRead]
    updated_at: datetime

    @field_validator("page_type", "status", mode="before")
    @classmethod
    def to_lower(cls, v: str | None) -> str | None:
        return v.lower() if isinstance(v, str) else str(v).lower() if v is not None else None


class PageListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    page_type: str
    slug: str
    title: str
    status: str
    updated_at: datetime

    @field_validator("page_type", "status", mode="before")
    @classmethod
    def to_lower(cls, v: str | None) -> str | None:
        return v.lower() if isinstance(v, str) else str(v).lower() if v is not None else None
