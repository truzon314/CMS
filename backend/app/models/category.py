import enum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CategoryAppliesTo(str, enum.Enum):
    BLOG = "blog"
    PROPERTY = "property"
    BOTH = "both"


class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Shared taxonomy for Blog posts and Properties."""

    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    applies_to: Mapped[CategoryAppliesTo] = mapped_column(
        "appliesTo", Enum(CategoryAppliesTo, name="CategoryAppliesTo", create_type=False), nullable=False
    )

