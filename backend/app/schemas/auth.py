from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str


class LoginResponseData(BaseModel):
    access_token: str
    expires_in: int
    user: UserRead


class RefreshResponseData(BaseModel):
    access_token: str
    expires_in: int


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str
    # The frontend's reset-password form already enforces 8 chars client-side
    # (app/(auth)/reset-password/page.tsx) — this was previously unenforced
    # server-side, so a direct API call could set an arbitrarily short/empty
    # password. Matches the client's existing minimum.
    new_password: str = Field(min_length=8)


class VerifyEmailRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str
    new_password: str = Field(min_length=8)
