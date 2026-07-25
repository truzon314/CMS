import math
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.auth.rbac import require_permission
from app.schemas.audit_log import AuditLogRead
from app.services.audit_service import AuditService
from app.shared.dependencies.container import get_audit_service
from app.shared.utils.common import PaginationMeta, ok

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("")
async def list_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    user_id: uuid.UUID | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    audit_service: AuditService = Depends(get_audit_service),
    _=Depends(require_permission("audit.view")),
):
    logs, total = await audit_service.list_logs(
        page=page,
        per_page=per_page,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        date_from=date_from,
        date_to=date_to,
    )
    data = [AuditLogRead.model_validate(entry).model_dump(mode="json") for entry in logs]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.get("/export")
async def export_audit_logs(
    user_id: uuid.UUID | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    audit_service: AuditService = Depends(get_audit_service),
    _=Depends(require_permission("audit.view")),
):
    csv_text = await audit_service.export_csv(
        user_id=user_id, action=action, entity_type=entity_type, date_from=date_from, date_to=date_to
    )
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit-log.csv"},
    )
