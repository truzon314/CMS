import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MediaFolder(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "media_folder"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_folder_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media_folder.id"), default=None
    )
