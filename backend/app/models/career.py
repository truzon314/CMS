from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class Career(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "careers"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(255), nullable=False, default="General")
    location: Mapped[str] = mapped_column(String(255), nullable=False, default="Headquarters")
    employment_type: Mapped[str] = mapped_column("type", String(100), nullable=False, default="Full-Time")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False, default="")
    responsibilities: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_published: Mapped[bool] = mapped_column("isActive", Boolean, nullable=False, default=True)
    is_featured: Mapped[bool] = mapped_column("isFeatured", Boolean, nullable=False, default=False)
    posted_at: Mapped[datetime] = mapped_column("postedAt", DateTime(timezone=True), nullable=False, default=utcnow)
    expires_at: Mapped[datetime | None] = mapped_column("expiresAt", DateTime(timezone=True), nullable=True)

    experience_min: Mapped[int | None] = mapped_column("experienceMin", Integer, nullable=True)
    experience_max: Mapped[int | None] = mapped_column("experienceMax", Integer, nullable=True)
    salary_min: Mapped[float | None] = mapped_column("salaryMin", Numeric, nullable=True)
    salary_max: Mapped[float | None] = mapped_column("salaryMax", Numeric, nullable=True)
    benefits: Mapped[str | None] = mapped_column(Text, nullable=True)

    @property
    def apply_email(self) -> str | None:
        return "careers@truzonhomes.com"

