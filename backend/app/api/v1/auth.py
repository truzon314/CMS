from fastapi import APIRouter, Depends, Request, Response

from app.auth.dependencies import get_current_user
from app.core.config import get_settings
from app.core.container import get_auth_service
from app.core.rate_limit import rate_limit
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
)
from app.schemas.common import ok
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

REFRESH_COOKIE_NAME = "refresh_token"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.environment != "development",
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 86400,
        path="/",
    )


@router.post("/login")
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    # Per-IP (brute-force) and per-account (credential-stuffing against one
    # target) — SECURITY_CHECKLIST.md §7.
    rate_limit(request, scope="auth.login.ip", limit=10, window_seconds=60)
    rate_limit(request, scope="auth.login.account", limit=5, window_seconds=60, extra_key=payload.email.lower())

    access_token, expires_in, refresh_token, user = await auth_service.login(
        payload.email,
        payload.password,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    _set_refresh_cookie(response, refresh_token)
    return ok(
        {
            "access_token": access_token,
            "expires_in": expires_in,
            "user": UserRead.model_validate(user).model_dump(mode="json"),
        }
    )


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME, "")
    access_token, expires_in, new_refresh_token = await auth_service.refresh(
        raw_token,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    _set_refresh_cookie(response, new_refresh_token)
    return ok({"access_token": access_token, "expires_in": expires_in})


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME, "")
    if raw_token:
        await auth_service.logout(raw_token)
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/")
    return ok({"logged_out": True})


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest, request: Request, auth_service: AuthService = Depends(get_auth_service)
):
    # Per-email (anti email-bombing) and per-IP — SECURITY_CHECKLIST.md §7.
    rate_limit(
        request, scope="auth.forgot_password.email", limit=3, window_seconds=3600, extra_key=payload.email.lower()
    )
    rate_limit(request, scope="auth.forgot_password.ip", limit=10, window_seconds=3600)

    await auth_service.forgot_password(payload.email)
    return ok({"message": "If that email exists, we've sent a reset link."})


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest, auth_service: AuthService = Depends(get_auth_service)
):
    await auth_service.reset_password(payload.token, payload.new_password)
    return ok({"reset": True})


@router.post("/verify-email")
async def verify_email(
    payload: VerifyEmailRequest, auth_service: AuthService = Depends(get_auth_service)
):
    await auth_service.verify_email(payload.token)
    return ok({"verified": True})


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return ok(UserRead.model_validate(user).model_dump(mode="json"))
