import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from app.shared.exceptions.exceptions import ConflictError, NotFoundError
from app.shared.security.security import generate_opaque_token, hash_opaque_token, hash_password
from app.domain.repositories.auth_token_repository import AuthTokenRepository
from app.domain.repositories.role_repository import RoleRepository
from app.domain.repositories.user_repository import UserRepository
from app.models.auth_token import AuthToken, AuthTokenPurpose
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit_service import AuditService

logger = logging.getLogger("truzon_cms.users")


class UserService:
    def __init__(
        self, users: UserRepository, roles: RoleRepository, auth_tokens: AuthTokenRepository, audit: AuditService
    ):
        self.users = users
        self.roles = roles
        self.auth_tokens = auth_tokens
        self.audit = audit

    async def list(self, *, page: int, per_page: int, search: str | None) -> tuple[list[User], int]:
        return await self.users.list(page=page, per_page=per_page, search=search)

    async def get(self, user_id: uuid.UUID) -> User:
        user = await self.users.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found.")
        return user

    async def create(self, payload: UserCreate, actor_id: uuid.UUID | None = None) -> User:
        if await self.users.get_by_email(payload.email):
            raise ConflictError("A user with that email already exists.")

        role = await self.roles.get_by_id(payload.role_id)
        if not role:
            raise NotFoundError("Role not found.")

        password_hash = (
            hash_password(payload.password) if payload.password else hash_password(secrets.token_urlsafe(32))
        )

        user = User(
            email=payload.email,
            full_name=payload.full_name,
            role_id=payload.role_id,
            password_hash=password_hash,
        )
        user = await self.users.create(user)
        await self.audit.log(actor_id, "user.create", "user", user.id, details={"email": user.email})

        if not payload.password:
            await self._send_invite(user)

        return user

    async def update(self, user_id: uuid.UUID, payload: UserUpdate, actor_id: uuid.UUID | None = None) -> User:
        user = await self.get(user_id)

        if payload.role_id is not None:
            role = await self.roles.get_by_id(payload.role_id)
            if not role:
                raise NotFoundError("Role not found.")
            user.role_id = payload.role_id

        if payload.full_name is not None:
            user.full_name = payload.full_name
        if payload.is_active is not None:
            user.is_active = payload.is_active

        user = await self.users.update(user)
        await self.audit.log(actor_id, "user.update", "user", user.id)
        return user

    async def soft_delete(self, user_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> None:
        user = await self.get(user_id)
        await self.users.soft_delete(user)
        await self.audit.log(actor_id, "user.delete", "user", user.id)

    async def restore(self, user_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> User:
        user = await self.get(user_id)
        await self.users.restore(user)
        await self.audit.log(actor_id, "user.restore", "user", user.id)
        return user

    async def _send_invite(self, user: User) -> None:
        raw_token = generate_opaque_token()
        auth_token = AuthToken(
            user_id=user.id,
            purpose=AuthTokenPurpose.PASSWORD_RESET,
            token_hash=hash_opaque_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=3),
        )
        await self.auth_tokens.create(auth_token)
        logger.info(
            "[dev email] to=%s subject='Set your Truzon CMS password' invite_token=%r",
            user.email,
            raw_token,
        )
