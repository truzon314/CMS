from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MapShareLink(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "map_share_links"

    project_id: Mapped[str] = mapped_column(
        "projectId", String, ForeignKey("map_projects.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column("passwordHash", String(255), default=None)
    expires_at: Mapped[datetime | None] = mapped_column("expiresAt", DateTime(timezone=True), default=None)
    max_views: Mapped[int | None] = mapped_column("maxViews", Integer, default=None)
    view_count: Mapped[int] = mapped_column("viewCount", Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True, nullable=False)

    project: Mapped["MapProject"] = relationship(back_populates="share_link")  # noqa: F821

