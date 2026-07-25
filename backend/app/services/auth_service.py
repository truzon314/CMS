import logging
import uuid
from datetime import datetime, timedelta, timezone

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError, ValidationAppError
from app.core.security import (
    create_access_token,
    generate_opaque_token,
    hash_opaque_token,
    hash_password,
    verify_password,
)
from app.domain.repositories.auth_token_repository import AuthTokenRepository
from app.domain.repositories.refresh_token_repository import RefreshTokenRepository
from app.domain.repositories.user_repository import UserRepository
from app.models.auth_token import AuthToken, AuthTokenPurpose
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services.audit_service import AuditService
from app.services.mailer_service import MailerService

logger = logging.getLogger("truzon_cms.auth")
settings = get_settings()

GENERIC_LOGIN_ERROR = "Invalid email or password."


class AuthService:
    def __init__(
        self,
        users: UserRepository,
        refresh_tokens: RefreshTokenRepository,
        auth_tokens: AuthTokenRepository,
        mailer: MailerService,
        audit: AuditService,
    ):
        self.users = users
        self.refresh_tokens = refresh_tokens
        self.auth_tokens = auth_tokens
        self.mailer = mailer
        self.audit = audit

    async def login(
        self, email: str, password: str, ip_address: str | None, user_agent: str | None
    ) -> tuple[str, int, str, User]:
        user = await self.users.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedError(GENERIC_LOGIN_ERROR)
        if not user.is_active:
            raise UnauthorizedError(GENERIC_LOGIN_ERROR)

        access_token, expires_in = create_access_token(user.id)
        refresh_token_raw = await self._issue_refresh_token(user.id, ip_address, user_agent)

        user.last_login_at = datetime.now(timezone.utc)
        await self.users.update(user)
        await self.audit.log(user.id, "auth.login", "user", user.id)

        return access_token, expires_in, refresh_token_raw, user

    async def refresh(
        self, raw_refresh_token: str, ip_address: str | None, user_agent: str | None
    ) -> tuple[str, int, str]:
        token_hash = hash_opaque_token(raw_refresh_token)
        token = await self.refresh_tokens.get_by_hash(token_hash)

        if not token:
            raise UnauthorizedError("Session expired, please log in again.")

        if token.revoked_at is not None:
            # Reuse of an already-rotated token — treat as compromised and kill the
            # whole session family (SECURITY_CHECKLIST.md §1).
            logger.warning("Refresh token reuse detected for user %s", token.user_id)
            await self.refresh_tokens.revoke_all_for_user(token.user_id)
            raise UnauthorizedError("Session expired, please log in again.")

        if token.expires_at < datetime.now(timezone.utc):
            raise UnauthorizedError("Session expired, please log in again.")

        await self.refresh_tokens.revoke(token)
        access_token, expires_in = create_access_token(token.user_id)
        new_refresh_token_raw = await self._issue_refresh_token(token.user_id, ip_address, user_agent)

        return access_token, expires_in, new_refresh_token_raw

    async def logout(self, raw_refresh_token: str) -> None:
        token_hash = hash_opaque_token(raw_refresh_token)
        token = await self.refresh_tokens.get_by_hash(token_hash)
        if token and token.revoked_at is None:
            await self.refresh_tokens.revoke(token)
            await self.audit.log(token.user_id, "auth.logout", "user", token.user_id)

    async def forgot_password(self, email: str) -> None:
        """Always returns normally regardless of whether the email exists —
        no user enumeration (NAVIGATION_FLOW.md / SECURITY_CHECKLIST.md §1)."""
        user = await self.users.get_by_email(email)
        if not user:
            return

        raw_token = generate_opaque_token()
        auth_token = AuthToken(
            user_id=user.id,
            purpose=AuthTokenPurpose.PASSWORD_RESET,
            token_hash=hash_opaque_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        await self.auth_tokens.create(auth_token)
        await self.mailer.send_email(
            user.email, "Reset your Truzon CMS password", f"Reset link token: {raw_token}"
        )

    async def reset_password(self, raw_token: str, new_password: str) -> None:
        token_hash = hash_opaque_token(raw_token)
        auth_token = await self.auth_tokens.get_valid_by_hash(
            token_hash, AuthTokenPurpose.PASSWORD_RESET
        )
        if not auth_token:
            raise ValidationAppError("This reset link is invalid or has expired.")

        user = await self.users.get_by_id(auth_token.user_id)
        if not user:
            raise ValidationAppError("This reset link is invalid or has expired.")

        user.password_hash = hash_password(new_password)
        await self.users.update(user)
        await self.auth_tokens.mark_used(auth_token)
        # Force re-login everywhere — a password reset should invalidate old sessions.
        await self.refresh_tokens.revoke_all_for_user(user.id)
        await self.audit.log(user.id, "auth.reset_password", "user", user.id)

    async def verify_email(self, raw_token: str) -> None:
        token_hash = hash_opaque_token(raw_token)
        auth_token = await self.auth_tokens.get_valid_by_hash(
            token_hash, AuthTokenPurpose.EMAIL_VERIFICATION
        )
        if not auth_token:
            raise ValidationAppError("This verification link is invalid or has expired.")

        user = await self.users.get_by_id(auth_token.user_id)
        if not user:
            raise ValidationAppError("This verification link is invalid or has expired.")

        user.is_email_verified = True
        await self.users.update(user)
        await self.auth_tokens.mark_used(auth_token)

    async def _issue_refresh_token(
        self, user_id: uuid.UUID, ip_address: str | None, user_agent: str | None
    ) -> str:
        raw_token = generate_opaque_token()
        token = RefreshToken(
            user_id=user_id,
            token_hash=hash_opaque_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.refresh_tokens.create(token)
        return raw_token
