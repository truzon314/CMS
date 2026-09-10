import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class EntityType(str, enum.Enum):
    PAGE = "PAGE"
    BLOG_POST = "BLOG_POST"
    PROPERTY = "PROPERTY"
    PROJECT = "PROJECT"


class EntityVersion(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "entity_versions"

    entity_type: Mapped[EntityType] = mapped_column(
        "entityType", Enum(EntityType, name="EntityType", create_type=False), nullable=False
    )
    entity_id: Mapped[str] = mapped_column("entityId", String, nullable=False, index=True)
    version_number: Mapped[int] = mapped_column("versionNumber", Integer, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    change_note: Mapped[str | None] = mapped_column("changeNote", String(255), default=None)
    created_by_id: Mapped[str] = mapped_column("createdById", String, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow)

    author: Mapped["User"] = relationship()  # noqa: F821

    @property
    def created_by(self) -> str:
        return self.created_by_id

    @created_by.setter
    def created_by(self, value: str) -> None:
        self.created_by_id = value


