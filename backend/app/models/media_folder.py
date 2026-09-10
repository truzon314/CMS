from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MediaFolder(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "media_folders"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_id: Mapped[str | None] = mapped_column("parentId", String, ForeignKey("media_folders.id"), default=None)
    path: Mapped[str] = mapped_column(String(500), unique=True, nullable=False, default="")

    parent: Mapped["MediaFolder | None"] = relationship("MediaFolder", remote_side="MediaFolder.id", backref="children")

    @property
    def parent_folder_id(self) -> str | None:
        return self.parent_id

    @parent_folder_id.setter
    def parent_folder_id(self, value: str | None) -> None:
        self.parent_id = value


