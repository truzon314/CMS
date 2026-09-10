from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class Career(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "careers"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, default="")
    department: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False, default="FULL_TIME")
    experience_min: Mapped[int | None] = mapped_column("experienceMin", Integer, default=None)
    experience_max: Mapped[int | None] = mapped_column("experienceMax", Integer, default=None)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False, default="")
    responsibilities: Mapped[str] = mapped_column(Text, nullable=False, default="")
    benefits: Mapped[str | None] = mapped_column(Text, default=None)
    salary_min: Mapped[Decimal | None] = mapped_column("salaryMin", Numeric(12, 2), default=None)
    salary_max: Mapped[Decimal | None] = mapped_column("salaryMax", Numeric(12, 2), default=None)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column("isFeatured", Boolean, default=False)
    posted_at: Mapped[datetime] = mapped_column("postedAt", DateTime(timezone=False), default=utcnow)
    expires_at: Mapped[datetime | None] = mapped_column("expiresAt", DateTime(timezone=False), default=None)

    @property
    def employment_type(self) -> str:
        return self.type

    @employment_type.setter
    def employment_type(self, value: str) -> None:
        self.type = value

    @property
    def is_published(self) -> bool:
        return self.is_active

    @is_published.setter
    def is_published(self, value: bool) -> None:
        self.is_active = value


