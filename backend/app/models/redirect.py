import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, UUIDPrimaryKeyMixin


class RedirectRule(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "redirect_rules"

    from_path: Mapped[str] = mapped_column("fromPath", String(500), unique=True, index=True, nullable=False)
    to_path: Mapped[str] = mapped_column("toPath", String(500), nullable=False)
    status_code: Mapped[int] = mapped_column("statusCode", Integer, default=301, nullable=False)
    hit_count: Mapped[int] = mapped_column("hitCount", Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

