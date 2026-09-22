
from pydantic import BaseModel, ConfigDict, field_validator

from app.models.category import CategoryAppliesTo


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    applies_to: list[str]


class CategoryCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    slug: str
    applies_to: list[str]

    @field_validator("applies_to", mode="before")
    @classmethod
    def coerce_to_list(cls, v):
        """Frontend sends applies_to as a plain string (e.g. "property").
        DB stores it as an array. Wrap single strings automatically."""
        if isinstance(v, str):
            return [v]
        return v


class CategoryUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    slug: str | None = None
    applies_to: list[str] | None = None

    @field_validator("applies_to", mode="before")
    @classmethod
    def coerce_to_list(cls, v):
        if isinstance(v, str):
            return [v]
        return v


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str


class TagCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    slug: str


class TagUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    slug: str | None = None
