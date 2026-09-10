from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Testimonial(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "testimonials"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    designation: Mapped[str | None] = mapped_column(String(255), default=None)
    company: Mapped[str | None] = mapped_column(String(255), default=None)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, default=5)
    media_id: Mapped[str | None] = mapped_column("mediaId", String, ForeignKey("media.id"), default=None)
    project_id: Mapped[str | None] = mapped_column("projectId", String, default=None)
    is_featured: Mapped[bool] = mapped_column("isFeatured", Boolean, default=False)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    sort_order: Mapped[int] = mapped_column("sortOrder", Integer, default=0)

    @property
    def quote(self) -> str:
        return self.content

    @quote.setter
    def quote(self, value: str) -> None:
        self.content = value

    @property
    def photo_media_id(self) -> str | None:
        return self.media_id

    @photo_media_id.setter
    def photo_media_id(self, value: str | None) -> None:
        self.media_id = value

    @property
    def role_or_location(self) -> str | None:
        return self.designation or self.company

    @role_or_location.setter
    def role_or_location(self, value: str | None) -> None:
        self.designation = value

    @property
    def is_published(self) -> bool:
        return self.is_active

    @is_published.setter
    def is_published(self, value: bool) -> None:
        self.is_active = value


