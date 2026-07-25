import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.role import RoleRead


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    full_name: str
    role_id: uuid.UUID
    password: str | None = None
    """If omitted, the user is created with no usable password and must set one
    via the same reset-password flow as forgot-password (an "invite" link)."""


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = None
    role_id: uuid.UUID | None = None
    is_active: bool | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: RoleRead
    is_active: bool
    is_email_verified: bool
    last_login_at: datetime | None
    created_at: datetime
