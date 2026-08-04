from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Career(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "career"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str | None] = mapped_column(String(255), default=None)
    location: Mapped[str | None] = mapped_column(String(255), default=None)
    employment_type: Mapped[str | None] = mapped_column(String(100), default=None)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    apply_email: Mapped[str | None] = mapped_column(String(255), default=None)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
