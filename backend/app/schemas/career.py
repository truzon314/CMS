import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CareerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    department: str | None
    location: str | None
    employment_type: str | None
    description: str
    apply_email: str | None
    is_published: bool
    created_at: datetime
    updated_at: datetime


class CareerCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    employment_type: str | None = Field(default=None, max_length=100)
    description: str = Field(min_length=1)
    apply_email: str | None = Field(default=None, max_length=255)
    is_published: bool = False


class CareerUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    employment_type: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, min_length=1)
    apply_email: str | None = Field(default=None, max_length=255)
    is_published: bool | None = None
