import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_name: str
    url: str
    mime_type: str
    size_bytes: int
    width: int | None
    height: int | None
    alt_text: str | None
    folder_id: uuid.UUID | None
    uploaded_by: uuid.UUID
    created_at: datetime


class MediaUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    file_name: str | None = None
    alt_text: str | None = None
    folder_id: uuid.UUID | None = None


class MediaUsageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    field_name: str


class MediaFolderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    parent_folder_id: uuid.UUID | None


class MediaFolderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    parent_folder_id: uuid.UUID | None = None


class MediaFolderUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    parent_folder_id: uuid.UUID | None = None
