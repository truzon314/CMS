import enum

from sqlalchemy import ARRAY, Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CategoryAppliesTo(str, enum.Enum):
    BLOG = "BLOG"
    PROPERTY = "PROPERTY"


class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Shared taxonomy for Blog posts and Properties."""

    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String, default=None)
    parent_id: Mapped[str | None] = mapped_column("parentId", String, ForeignKey("categories.id"), default=None)
    applies_to: Mapped[list[str]] = mapped_column("appliesTo", ARRAY(String), nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    sort_order: Mapped[int] = mapped_column("sortOrder", Integer, default=0)

    parent: Mapped["Category | None"] = relationship("Category", remote_side="Category.id", backref="children")


