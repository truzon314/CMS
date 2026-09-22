from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CareerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    slug: str
    department: str
    location: str
    employment_type: str | None
    description: str
    requirements: str | None = None
    responsibilities: str | None = None
    apply_email: str | None
    is_published: bool
    is_featured: bool = False
    created_at: datetime
    updated_at: datetime


class CareerCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = Field(min_length=1, max_length=255)
    slug: str | None = None
    department: str | None = Field(default="General", max_length=255)
    location: str | None = Field(default="Headquarters", max_length=255)
    employment_type: str | None = Field(default="Full-Time", max_length=100)
    description: str = Field(min_length=1)
    requirements: str | None = ""
    responsibilities: str | None = ""
    apply_email: str | None = Field(default=None, max_length=255)
    is_published: bool = True
    is_featured: bool = False


class CareerUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = None
    department: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    employment_type: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, min_length=1)
    requirements: str | None = None
    responsibilities: str | None = None
    apply_email: str | None = Field(default=None, max_length=255)
    is_published: bool | None = None
    is_featured: bool | None = None
