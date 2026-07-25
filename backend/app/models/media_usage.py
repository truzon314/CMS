import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, UUIDPrimaryKeyMixin


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

    __tablename__ = "media_usage"

    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id"), nullable=False, index=True
    )
    entity_type: Mapped[MediaUsageEntityType] = mapped_column(
        Enum(MediaUsageEntityType, name="media_usage_entity_type"), nullable=False
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    field_name: Mapped[str] = mapped_column(String(255), nullable=False)
