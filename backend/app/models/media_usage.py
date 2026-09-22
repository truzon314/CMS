from datetime import datetime, timezone
import enum
import uuid

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, UUIDPrimaryKeyMixin


def naive_utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class MediaUsageEntityType(str, enum.Enum):
    PAGE = "page"
    BLOG_POST = "blog_post"
    PROPERTY = "property"
    MENU = "menu"
    SETTINGS = "settings"


class MediaUsage(UUIDPrimaryKeyMixin, Base):
    """Polymorphic usage tracking (ERD.md) — no DB-level FK to the referencing
    entity, since it spans Pages/Blog/Properties/Menus/Settings. Powers the
    safe-delete check: a `Media` row can't be deleted while any row here
    references it, unless `?force=true`."""

    __tablename__ = "media_usages"

    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=naive_utcnow, nullable=False)
    media_id: Mapped[str] = mapped_column(
        "mediaId", String(255), ForeignKey("media.id"), nullable=False, index=True
    )
    entity_type: Mapped[MediaUsageEntityType] = mapped_column(
        "entityType", String(50), nullable=False
    )
    entity_id: Mapped[str] = mapped_column("entityId", String(255), nullable=False, index=True)
    field_name: Mapped[str] = mapped_column("fieldName", String(255), nullable=False)


