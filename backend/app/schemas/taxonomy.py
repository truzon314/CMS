import uuid

from pydantic import BaseModel, ConfigDict

from app.models.category import CategoryAppliesTo


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    applies_to: CategoryAppliesTo


class CategoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    slug: str
    applies_to: CategoryAppliesTo


class CategoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    slug: str | None = None
    applies_to: CategoryAppliesTo | None = None


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str


class TagCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    slug: str


class TagUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    slug: str | None = None
