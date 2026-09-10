from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class GalleryItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "gallery_items"

    title: Mapped[str | None] = mapped_column(String(255), default=None)
    description: Mapped[str | None] = mapped_column(String(1000), default=None)
    media_id: Mapped[str] = mapped_column("mediaId", String, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), default=None)
    project_id: Mapped[str | None] = mapped_column("projectId", String, default=None)
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)

    @property
    def caption(self) -> str | None:
        return self.description

    @caption.setter
    def caption(self, value: str | None) -> None:
        self.description = value

    @property
    def sort_order(self) -> int:
        return self.position

    @sort_order.setter
    def sort_order(self, value: int) -> None:
        self.position = value

    @property
    def is_published(self) -> bool:
        return self.is_active

    @is_published.setter
    def is_published(self, value: bool) -> None:
        self.is_active = value


