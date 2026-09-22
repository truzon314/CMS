from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    file_name: str
    url: str
    mime_type: str
    size_bytes: int
    width: int | None
    height: int | None
    alt_text: str | None
    folder_id: str | None
    uploaded_by: str
    created_at: datetime


class MediaUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    file_name: str | None = None
    alt_text: str | None = None
    folder_id: str | None = None


class MediaUsageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entity_type: str
    entity_id: str
    field_name: str


class MediaFolderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    parent_folder_id: str | None


class MediaFolderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    parent_folder_id: str | None = None


class MediaFolderUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    parent_folder_id: str | None = None
