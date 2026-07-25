import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.seo import SeoMetaInput, SeoMetaRead


class BlockDefinitionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    key: str
    label: str
    is_active: bool


class PageBlockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    block_definition_id: uuid.UUID
    position: int
    config: dict


class PageBlockCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    block_definition_id: uuid.UUID
    position: int | None = None
    config: dict = {}


class PageBlockUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    config: dict


class BlocksReorderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order: list[uuid.UUID]


class PageUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = None
    seo: SeoMetaInput | None = None


class ScheduleRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scheduled_at: datetime


class PageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    page_type: str
    slug: str
    title: str
    status: str
    published_at: datetime | None
    scheduled_at: datetime | None
    seo: SeoMetaRead | None
    blocks: list[PageBlockRead]
    updated_at: datetime


class PageListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    page_type: str
    slug: str
    title: str
    status: str
    updated_at: datetime
