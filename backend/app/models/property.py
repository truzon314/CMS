import enum
from decimal import Decimal

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, Numeric, String, Table, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

property_category = Table(
    "_PropertyCategories",
    Base.metadata,
    Column("A", String, ForeignKey("properties.id", ondelete="CASCADE"), primary_key=True),
    Column("B", String, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class BudgetBracket(str, enum.Enum):
    UNDER_2 = "under2"
    RANGE_2_TO_5 = "2to5"
    RANGE_5_TO_10 = "5to10"
    OVER_10 = "10plus"


class PropertyType(str, enum.Enum):
    VILLA = "VILLA"
    PLOT = "PLOT"
    APARTMENT = "APARTMENT"
    COMMERCIAL = "COMMERCIAL"


class PropertyStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


class Property(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "properties"

    project_id: Mapped[str | None] = mapped_column("projectId", String, default=None)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    property_type: Mapped[PropertyType] = mapped_column(
        "propertyType", Enum(PropertyType, name="PropertyType", create_type=False), default=PropertyType.VILLA, nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, default=None)
    short_description: Mapped[str | None] = mapped_column("shortDescription", Text, default=None)
    configuration: Mapped[str | None] = mapped_column(String(255), default=None)
    facing: Mapped[str | None] = mapped_column(String(100), default=None)
    plot_size: Mapped[Decimal | None] = mapped_column("plotSize", Numeric(12, 2), default=None)
    built_up_area: Mapped[Decimal | None] = mapped_column("builtUpArea", Numeric(12, 2), default=None)
    carpet_area: Mapped[Decimal | None] = mapped_column("carpetArea", Numeric(12, 2), default=None)
    price_display: Mapped[str | None] = mapped_column("priceDisplay", String(100), default=None)
    price_value: Mapped[Decimal | None] = mapped_column("priceValue", Numeric(14, 2), default=None)
    price_per_sqft: Mapped[Decimal | None] = mapped_column("pricePerSqft", Numeric(10, 2), default=None)
    bedrooms: Mapped[int | None] = mapped_column(Integer, default=None)
    bathrooms: Mapped[int | None] = mapped_column(Integer, default=None)
    balconies: Mapped[int | None] = mapped_column(Integer, default=None)
    floor_number: Mapped[int | None] = mapped_column("floorNumber", Integer, default=None)
    total_floors: Mapped[int | None] = mapped_column("totalFloors", Integer, default=None)
    amenities: Mapped[list | None] = mapped_column(JSONB, default=None)
    specifications: Mapped[dict | None] = mapped_column(JSONB, default=None)
    is_signature: Mapped[bool] = mapped_column("isSignature", Boolean, default=False)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    sort_order: Mapped[int] = mapped_column("sortOrder", Integer, default=0, nullable=False)

    created_by_id: Mapped[str | None] = mapped_column("createdById", String, ForeignKey("users.id"), default=None)
    updated_by_id: Mapped[str | None] = mapped_column("updatedById", String, ForeignKey("users.id"), default=None)
    categories: Mapped[list["Category"]] = relationship(secondary=property_category)  # noqa: F821
    gallery: Mapped[list["PropertyMedia"]] = relationship(  # noqa: F821
        back_populates="property", order_by="PropertyMedia.position", cascade="all, delete-orphan"
    )

    @property
    def map_project_id(self) -> str | None:
        return None

    @property
    def seo_id(self) -> str | None:
        return None

    @property
    def seo(self) -> None:
        return None

    @property
    def status(self) -> PropertyStatus:
        return PropertyStatus.PUBLISHED if self.is_active else PropertyStatus.DRAFT

    @status.setter
    def status(self, value: PropertyStatus | str) -> None:
        val_str = str(value).upper()
        self.is_active = val_str == "PUBLISHED"


