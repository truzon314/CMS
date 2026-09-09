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
    __tablename__ = "media_usages"

    media_id: Mapped[str] = mapped_column(
        "mediaId", String, ForeignKey("media.id"), nullable=False, index=True
    )
    entity_type: Mapped[MediaUsageEntityType] = mapped_column(
        "entityType", Enum(MediaUsageEntityType, name="MediaUsageEntityType", create_type=False), nullable=False
    )
    entity_id: Mapped[str] = mapped_column("entityId", String, nullable=False, index=True)
    field_name: Mapped[str] = mapped_column("fieldName", String(255), nullable=False)

