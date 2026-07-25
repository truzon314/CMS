import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditLog

_WITH_USER = selectinload(AuditLog.user)


class SqlAlchemyAuditLogRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, entry: AuditLog) -> AuditLog:
        self.session.add(entry)
        await self.session.commit()
        await self.session.refresh(entry, attribute_names=["user"])
        return entry

    def _filtered(
        self,
        stmt,
        user_id: uuid.UUID | None,
        action: str | None,
        entity_type: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
    ):
        if user_id:
            stmt = stmt.where(AuditLog.user_id == user_id)
        if action:
            stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))
        if entity_type:
            stmt = stmt.where(AuditLog.entity_type == entity_type)
        if date_from:
            stmt = stmt.where(AuditLog.created_at >= date_from)
        if date_to:
            stmt = stmt.where(AuditLog.created_at <= date_to)
        return stmt

    async def list(
        self,
        *,
        page: int,
        per_page: int,
        user_id: uuid.UUID | None = None,
        action: str | None = None,
        entity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[AuditLog], int]:
        stmt = self._filtered(
            select(AuditLog).options(_WITH_USER), user_id, action, entity_type, date_from, date_to
        )
        count_stmt = self._filtered(
            select(func.count()).select_from(AuditLog), user_id, action, entity_type, date_from, date_to
        )

        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(AuditLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), total

    async def list_all_matching(
        self,
        *,
        user_id: uuid.UUID | None = None,
        action: str | None = None,
        entity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> list[AuditLog]:
        stmt = self._filtered(
            select(AuditLog).options(_WITH_USER), user_id, action, entity_type, date_from, date_to
        ).order_by(AuditLog.created_at.desc())
        return list((await self.session.execute(stmt)).scalars().all())
