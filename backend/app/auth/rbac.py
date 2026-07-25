from collections.abc import Callable

from fastapi import Depends

from app.auth.dependencies import get_current_user
from app.shared.exceptions.exceptions import ForbiddenError
from app.models.user import User


def require_permission(permission_key: str) -> Callable:
    """Single choke point for authorization (SECURITY_CHECKLIST.md §2) — every
    protected route depends on this rather than checking permissions inline.
    """

    async def _check(user: User = Depends(get_current_user)) -> User:
        user_permission_keys = {p.key for p in user.role.permissions}
        if permission_key not in user_permission_keys:
            raise ForbiddenError(f"You don't have the '{permission_key}' permission.")
        return user

    return _check


def require_any_permission(*permission_keys: str) -> Callable:
    """Same choke point, `OR` semantics — Categories are edited by either
    `blog.edit` or `properties.edit` (API.md), not a third dedicated key."""

    async def _check(user: User = Depends(get_current_user)) -> User:
        user_permission_keys = {p.key for p in user.role.permissions}
        if not user_permission_keys.intersection(permission_keys):
            keys = "' or '".join(permission_keys)
            raise ForbiddenError(f"You don't have the '{keys}' permission.")
        return user

    return _check
