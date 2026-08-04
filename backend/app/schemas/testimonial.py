import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TestimonialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    role_or_location: str | None
    quote: str
    photo_media_id: uuid.UUID | None
    rating: int | None
    is_featured: bool
    is_published: bool
    created_at: datetime
    updated_at: datetime


class TestimonialCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=255)
    role_or_location: str | None = Field(default=None, max_length=255)
    quote: str = Field(min_length=1)
    photo_media_id: uuid.UUID | None = None
    rating: int | None = Field(default=None, ge=1, le=5)
    is_featured: bool = False
    is_published: bool = False


class TestimonialUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=255)
    role_or_location: str | None = Field(default=None, max_length=255)
    quote: str | None = Field(default=None, min_length=1)
    photo_media_id: uuid.UUID | None = None
    rating: int | None = Field(default=None, ge=1, le=5)
    is_featured: bool | None = None
    is_published: bool | None = None
