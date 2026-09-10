from datetime import datetime
import enum

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class MediaUsageEntityType(str, enum.Enum):
    PAGE = "PAGE"
    BLOG_POST = "BLOG_POST"
    PROPERTY = "PROPERTY"
    MENU = "MENU"
    SETTINGS = "SETTINGS"


class MediaUsage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "media_usages"

    media_id: Mapped[str] = mapped_column(
        "mediaId", String, ForeignKey("media.id", ondelete="CASCADE"), nullable=False, index=True
    )
    entity_type: Mapped[str] = mapped_column("entityType", String(100), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column("entityId", String, nullable=False, index=True)
    field_name: Mapped[str | None] = mapped_column("fieldName", String(255), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow)


