from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.schemas.role import RoleRead


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    full_name: str
    role_id: str
    password: str | None = None
    """If omitted, the user is created with no usable password and must set one
    via the same reset-password flow as forgot-password (an "invite" link)."""


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = None
    role_id: str | None = None
    is_active: bool | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: RoleRead
    is_active: bool
    is_email_verified: bool
    last_login_at: datetime | None
    created_at: datetime

    @field_validator("is_active", mode="before")
    @classmethod
    def normalize_is_active(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "active", "t")
        return bool(v)

    @field_validator("is_email_verified", mode="before")
    @classmethod
    def normalize_is_email_verified(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "active", "t")
        return bool(v)
