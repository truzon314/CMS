import enum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CategoryAppliesTo(str, enum.Enum):
    BLOG = "blog"
    PROPERTY = "property"
    BOTH = "both"


class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Shared taxonomy for Blog posts and Properties (ERD.md) — one table, two
    join tables (`blog_post_category`, `property_category`)."""

    __tablename__ = "category"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    applies_to: Mapped[CategoryAppliesTo] = mapped_column(
        Enum(CategoryAppliesTo, name="category_applies_to"), nullable=False
    )
