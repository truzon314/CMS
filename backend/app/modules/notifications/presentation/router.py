import math
import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationRead
from app.services.notification_service import NotificationService
from app.shared.dependencies.container import get_notification_service
from app.shared.utils.common import PaginationMeta, ok

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    notification_service: NotificationService = Depends(get_notification_service),
    user: User = Depends(get_current_user),
):
    notifications, total = await notification_service.list_for_user(
        user.id, page=page, per_page=per_page, unread_only=unread_only
    )
    data = [NotificationRead.model_validate(n).model_dump(mode="json") for n in notifications]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.get("/unread-count")
async def unread_count(
    notification_service: NotificationService = Depends(get_notification_service),
    user: User = Depends(get_current_user),
):
    count = await notification_service.unread_count(user.id)
    return ok({"count": count})


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: uuid.UUID,
    notification_service: NotificationService = Depends(get_notification_service),
    user: User = Depends(get_current_user),
):
    notification = await notification_service.mark_read(user.id, notification_id)
    return ok(NotificationRead.model_validate(notification).model_dump(mode="json"))


@router.post("/read-all")
async def mark_all_read(
    notification_service: NotificationService = Depends(get_notification_service),
    user: User = Depends(get_current_user),
):
    await notification_service.mark_all_read(user.id)
    return ok({"marked_all_read": True})
