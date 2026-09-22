import enum

from sqlalchemy import Boolean, Enum, Integer, String, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CategoryAppliesTo(str, enum.Enum):
    BLOG = "BLOG"
    PROPERTY = "PROPERTY"
    BOTH = "BOTH"


class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Shared taxonomy for Blog posts and Properties."""

    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    applies_to: Mapped[list[str]] = mapped_column(
        "appliesTo", ARRAY(String), nullable=False
    )
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column("sortOrder", Integer, nullable=False, default=0)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    parent_id: Mapped[str | None] = mapped_column("parentId", String(255), nullable=True)
