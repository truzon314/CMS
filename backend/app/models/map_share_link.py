from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class MapShareLink(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "map_share_links"

    project_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("map_projects.id", ondelete="CASCADE"), nullable=False
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), default=None)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    max_views: Mapped[int | None] = mapped_column(Integer, default=None)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    created_by_id: Mapped[str | None] = mapped_column(String(255), default=None)

    project: Mapped["MapProject"] = relationship(back_populates="share_link")  # noqa: F821

    @property
    def password_hash(self) -> str | None:
        return self.password

    @password_hash.setter
    def password_hash(self, value: str | None) -> None:
        self.password = value
