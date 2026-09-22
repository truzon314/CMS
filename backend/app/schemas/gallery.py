from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GalleryItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    media_id: str
    caption: str | None
    category: str | None
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime


class GalleryItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    media_id: str
    caption: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    sort_order: int = 0
    is_published: bool = False


class GalleryItemUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    media_id: str | None = None
    caption: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    sort_order: int | None = None
    is_published: bool | None = None
