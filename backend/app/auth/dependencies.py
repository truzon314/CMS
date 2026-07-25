from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.shared.dependencies.container import get_user_repository
from app.shared.exceptions.exceptions import UnauthorizedError
from app.shared.security.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import SqlAlchemyUserRepository

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    users: SqlAlchemyUserRepository = Depends(get_user_repository),
) -> User:
    if credentials is None:
        raise UnauthorizedError("Not authenticated.")

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise UnauthorizedError("Invalid or expired session.")

    user = await users.get_by_id(user_id)
    if user is None or user.deleted_at is not None or not user.is_active:
        raise UnauthorizedError("Invalid or expired session.")

    return user
