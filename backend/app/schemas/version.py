from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EntityVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    version_number: int
    change_note: str | None
    created_by: str
    created_at: datetime
