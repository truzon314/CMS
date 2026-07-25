import uuid

from app.core.exceptions import NotFoundError
from app.domain.repositories.notification_repository import NotificationRepository
from app.models.notification import Notification


class NotificationService:
    def __init__(self, notifications: NotificationRepository):
        self.notifications = notifications

    async def notify(
        self, user_ids: list[uuid.UUID], type: str, title: str, message: str | None = None, link: str | None = None
    ) -> None:
        if not user_ids:
            return
        rows = [
            Notification(user_id=uid, type=type, title=title, message=message, link=link) for uid in user_ids
        ]
        await self.notifications.create_many(rows)

    async def list_for_user(
        self, user_id: uuid.UUID, *, page: int, per_page: int, unread_only: bool = False
    ) -> tuple[list[Notification], int]:
        return await self.notifications.list_for_user(user_id, page=page, per_page=per_page, unread_only=unread_only)

    async def unread_count(self, user_id: uuid.UUID) -> int:
        return await self.notifications.unread_count(user_id)

    async def mark_read(self, user_id: uuid.UUID, notification_id: uuid.UUID) -> Notification:
        notification = await self.notifications.get_by_id(notification_id)
        if not notification or notification.user_id != user_id:
            raise NotFoundError("Notification not found.")
        return await self.notifications.mark_read(notification)

    async def mark_all_read(self, user_id: uuid.UUID) -> None:
        await self.notifications.mark_all_read(user_id)
