import uuid
from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.permission import Permission
from app.models.role import Role, role_permission
from app.models.user import User

# Every read needs role.permissions available synchronously for RBAC checks
# (app/auth/rbac.py) without triggering an async lazy-load.
_WITH_ROLE_AND_PERMISSIONS = selectinload(User.role).selectinload(Role.permissions)


class SqlAlchemyUserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        stmt = select(User).where(User.id == user_id).options(_WITH_ROLE_AND_PERMISSIONS)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        stmt = (
            select(User)
            .where(func.lower(User.email) == email.lower(), User.deleted_at.is_(None))
            .options(_WITH_ROLE_AND_PERMISSIONS)
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list(
        self, *, page: int, per_page: int, search: str | None = None
    ) -> tuple[list[User], int]:
        stmt = select(User).where(User.deleted_at.is_(None)).options(_WITH_ROLE_AND_PERMISSIONS)
        count_stmt = select(func.count()).select_from(User).where(User.deleted_at.is_(None))

        if search:
            like = f"%{search}%"
            search_filter = or_(User.email.ilike(like), User.full_name.ilike(like))
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), total

    async def list_by_permission(self, permission_key: str) -> list[User]:
        stmt = (
            select(User)
            .join(Role, User.role_id == Role.id)
            .join(role_permission, Role.id == role_permission.c.role_id)
            .join(Permission, role_permission.c.permission_id == Permission.id)
            .where(Permission.key == permission_key, User.deleted_at.is_(None), User.is_active.is_(True))
            .options(_WITH_ROLE_AND_PERMISSIONS)
        )
        return list((await self.session.execute(stmt)).unique().scalars().all())

    async def create(self, user: User) -> User:
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user, attribute_names=["role"])
        return user

    async def update(self, user: User) -> User:
        await self.session.commit()
        await self.session.refresh(user, attribute_names=["role"])
        return user

    async def soft_delete(self, user: User) -> None:
        user.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()

    async def restore(self, user: User) -> None:
        user.deleted_at = None
        await self.session.commit()
