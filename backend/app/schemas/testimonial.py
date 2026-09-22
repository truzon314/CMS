from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TestimonialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    role_or_location: str | None
    quote: str
    photo_media_id: str | None
    rating: int | None
    is_featured: bool
    is_published: bool
    created_at: datetime
    updated_at: datetime


class TestimonialCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(min_length=1, max_length=255)
    role_or_location: str | None = Field(default=None, max_length=255)
    quote: str = Field(min_length=1)
    photo_media_id: str | None = None
    rating: int | None = Field(default=5, ge=1, le=5)
    is_featured: bool = False
    is_published: bool = True
    sort_order: int = 0


class TestimonialUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = Field(default=None, min_length=1, max_length=255)
    role_or_location: str | None = Field(default=None, max_length=255)
    quote: str | None = Field(default=None, min_length=1)
    photo_media_id: str | None = None
    rating: int | None = Field(default=None, ge=1, le=5)
    is_featured: bool | None = None
    is_published: bool | None = None
    sort_order: int | None = None
