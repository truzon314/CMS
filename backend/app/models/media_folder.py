from sqlalchemy import ForeignKey, String

from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MediaFolder(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "media_folders"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_folder_id: Mapped[str | None] = mapped_column(
        "parentId", String(255), ForeignKey("media_folders.id"), default=None
    )
    path: Mapped[str] = mapped_column(String(500), nullable=False, default="")

