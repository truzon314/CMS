import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class EntityType(str, enum.Enum):
    PAGE = "PAGE"
    BLOG_POST = "BLOG_POST"
    PROPERTY = "PROPERTY"
    PROJECT = "PROJECT"
    SETTINGS = "SETTINGS"


class EntityVersion(UUIDPrimaryKeyMixin, Base):
    """One generic, polymorphic version-history table for Pages/Blog/Settings
    (ERD.md) instead of three near-duplicate tables."""

    __tablename__ = "entity_versions"

    entity_type: Mapped[EntityType] = mapped_column(
        "entityType", Enum(EntityType, name="EntityType", create_type=False), nullable=False
    )
    entity_id: Mapped[str] = mapped_column("entityId", String(255), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column("versionNumber", Integer, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    change_note: Mapped[str | None] = mapped_column("changeNote", String(255), default=None)
    created_by: Mapped[str] = mapped_column("createdById", String(255), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=utcnow)

    author: Mapped["User"] = relationship()  # noqa: F821
