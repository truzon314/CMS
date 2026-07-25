import logging
import uuid
from datetime import datetime

from app.core.audit_context import current_ip, current_user_agent
from app.domain.repositories.audit_log_repository import AuditLogRepository
from app.models.audit_log import AuditLog

logger = logging.getLogger("truzon_cms.audit")


class AuditService:
    def __init__(self, audit_logs: AuditLogRepository):
        self.audit_logs = audit_logs

    async def log(
        self,
        user_id: uuid.UUID | None,
        action: str,
        entity_type: str | None = None,
        entity_id: uuid.UUID | None = None,
        details: dict | None = None,
    ) -> None:
        """Never lets an audit-write failure break the real mutation it's
        logging — an audit row is important, but not important enough to
        500 an otherwise-successful admin action."""
        try:
            await self.audit_logs.create(
                AuditLog(
                    user_id=user_id,
                    action=action,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    ip_address=current_ip(),
                    user_agent=current_user_agent(),
                    details=details,
                )
            )
        except Exception:
            logger.exception("Failed to write audit log entry for action=%s", action)

    async def list_logs(
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
        return await self.audit_logs.list(
            page=page,
            per_page=per_page,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            date_from=date_from,
            date_to=date_to,
        )

    async def export_csv(
        self,
        *,
        user_id: uuid.UUID | None = None,
        action: str | None = None,
        entity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> str:
        import csv
        import io

        rows = await self.audit_logs.list_all_matching(
            user_id=user_id, action=action, entity_type=entity_type, date_from=date_from, date_to=date_to
        )
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["created_at", "user_email", "action", "entity_type", "entity_id", "ip_address"])
        for row in rows:
            writer.writerow(
                [
                    row.created_at.isoformat(),
                    row.user.email if row.user else "",
                    row.action,
                    row.entity_type or "",
                    str(row.entity_id) if row.entity_id else "",
                    row.ip_address or "",
                ]
            )
        return buffer.getvalue()
