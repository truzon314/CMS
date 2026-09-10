from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow


class MapShareLink(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "map_share_links"

    project_id: Mapped[str] = mapped_column(
        "project_id", String, ForeignKey("map_projects.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, default=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column("password_hash", String(255), default=None)
    expires_at: Mapped[datetime | None] = mapped_column("expires_at", DateTime(timezone=False), default=None)
    max_views: Mapped[int | None] = mapped_column("max_views", Integer, default=None)
    view_count: Mapped[int] = mapped_column("view_count", Integer, default=0, nullable=False)
    created_by_id: Mapped[str | None] = mapped_column("created_by_id", String, ForeignKey("users.id"), default=None)
    created_at: Mapped[datetime] = mapped_column("created_at", DateTime(timezone=False), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column("updated_at", DateTime(timezone=False), default=utcnow, onupdate=utcnow)

    project: Mapped["MapProject"] = relationship(back_populates="share_link")  # noqa: F821


