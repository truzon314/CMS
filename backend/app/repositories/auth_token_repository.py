from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth_token import AuthToken, AuthTokenPurpose


class SqlAlchemyAuthTokenRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, token: AuthToken) -> AuthToken:
        self.session.add(token)
        await self.session.commit()
        await self.session.refresh(token)
        return token

    async def get_valid_by_hash(self, token_hash: str, purpose: AuthTokenPurpose) -> AuthToken | None:
        stmt = select(AuthToken).where(
            AuthToken.token_hash == token_hash,
            AuthToken.purpose == purpose,
            AuthToken.used_at.is_(None),
            AuthToken.expires_at > datetime.now(timezone.utc),
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def mark_used(self, token: AuthToken) -> None:
        token.used_at = datetime.now(timezone.utc)
        await self.session.commit()
