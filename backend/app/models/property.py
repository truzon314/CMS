import enum
import uuid
from decimal import Decimal

from sqlalchemy import JSON, Boolean, Column, Enum, ForeignKey, Numeric, String, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

property_category = Table(
    "property_category",
    Base.metadata,
    Column("property_id", UUID(as_uuid=True), ForeignKey("property.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("category.id", ondelete="CASCADE"), primary_key=True),
)


class BudgetBracket(str, enum.Enum):
    UNDER_2 = "under2"
    RANGE_2_TO_5 = "2to5"
    RANGE_5_TO_10 = "5to10"
    OVER_10 = "10plus"


class PropertyStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class Property(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "property"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    city: Mapped[str | None] = mapped_column(String(150), default=None)
    location_text: Mapped[str | None] = mapped_column(String(255), default=None)
    price_display: Mapped[str | None] = mapped_column(String(100), default=None)
    price_value: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), default=None)
    budget_bracket: Mapped[BudgetBracket | None] = mapped_column(
        Enum(BudgetBracket, name="budget_bracket"), default=None
    )
    spec_a: Mapped[str | None] = mapped_column(String(100), default=None)
    spec_b: Mapped[str | None] = mapped_column(String(100), default=None)
    area_sqft: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), default=None)
    beds_options: Mapped[list | None] = mapped_column(JSON, default=None)
    tag_text: Mapped[str | None] = mapped_column(String(50), default=None)
    status_text: Mapped[str | None] = mapped_column(String(50), default=None)
    is_signature: Mapped[bool] = mapped_column(Boolean, default=False)
    featured_image_media_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), default=None)
    seo_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("seo_meta.id"), default=None)
    status: Mapped[PropertyStatus] = mapped_column(
        Enum(PropertyStatus, name="property_status"), default=PropertyStatus.DRAFT, nullable=False
    )

    seo: Mapped["SeoMeta | None"] = relationship()  # noqa: F821
    categories: Mapped[list["Category"]] = relationship(secondary=property_category)  # noqa: F821
    gallery: Mapped[list["PropertyMedia"]] = relationship(  # noqa: F821
        back_populates="property", order_by="PropertyMedia.position", cascade="all, delete-orphan"
    )
