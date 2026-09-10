from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class MapShareLink(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "map_share_links"

    map_project_id: Mapped[str] = mapped_column(
        "mapProjectId", String, ForeignKey("map_projects.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True, nullable=False)
    password: Mapped[str | None] = mapped_column("password", String(255), default=None)
    expires_at: Mapped[datetime | None] = mapped_column("expiresAt", DateTime(timezone=False), default=None)
    max_views: Mapped[int | None] = mapped_column("maxViews", Integer, default=None)
    view_count: Mapped[int] = mapped_column("viewCount", Integer, default=0, nullable=False)
    created_by_id: Mapped[str] = mapped_column("createdById", String, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow)

    project: Mapped["MapProject"] = relationship(back_populates="share_link")  # noqa: F821

    @property
    def password_hash(self) -> str | None:
        return self.password

    @password_hash.setter
    def password_hash(self, value: str | None) -> None:
        self.password = value
