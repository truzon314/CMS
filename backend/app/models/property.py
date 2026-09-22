import enum
from decimal import Decimal

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, Numeric, String, Table, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.category import Category
from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

property_category = Table(
    "_PropertyCategories",
    Base.metadata,
    Column("A", String(255), ForeignKey("properties.id", ondelete="CASCADE"), primary_key=True),
    Column("B", String(255), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
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

    project_id: Mapped[str | None] = mapped_column("projectId", String(255), default=None)
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

    created_by_id: Mapped[str | None] = mapped_column("createdById", String(255), ForeignKey("users.id"), default=None)
    updated_by_id: Mapped[str | None] = mapped_column("updatedById", String(255), ForeignKey("users.id"), default=None)
    categories: Mapped[list["Category"]] = relationship(
        secondary=property_category,
        primaryjoin=lambda: Property.id == property_category.c.A,
        secondaryjoin=lambda: Category.id == property_category.c.B,
    )  # noqa: F821
    gallery: Mapped[list["PropertyMedia"]] = relationship(  # noqa: F821
        back_populates="property", order_by="PropertyMedia.position", cascade="all, delete-orphan"
    )

    map_project_id: Mapped[str | None] = mapped_column("mapProjectId", String(255), ForeignKey("map_projects.id"), default=None)
    seo_id: Mapped[str | None] = mapped_column("seoId", String(255), ForeignKey("seo_meta.id"), default=None)
    seo: Mapped["SeoMeta | None"] = relationship(foreign_keys=[seo_id])

    created_by_id: Mapped[str | None] = mapped_column("createdById", String(255), ForeignKey("users.id"), default=None)
    updated_by_id: Mapped[str | None] = mapped_column("updatedById", String(255), ForeignKey("users.id"), default=None)
    categories: Mapped[list["Category"]] = relationship(
        secondary=property_category,
        primaryjoin=lambda: Property.id == property_category.c.A,
        secondaryjoin=lambda: Category.id == property_category.c.B,
    )  # noqa: F821
    gallery: Mapped[list["PropertyMedia"]] = relationship(  # noqa: F821
        back_populates="property", order_by="PropertyMedia.position", cascade="all, delete-orphan"
    )

    def _get_spec(self, key: str, fallback=None):
        if self.specifications and isinstance(self.specifications, dict):
            return self.specifications.get(key, fallback)
        return fallback

    def _set_spec(self, key: str, value):
        from sqlalchemy.orm.attributes import flag_modified
        specs = dict(self.specifications) if (self.specifications and isinstance(self.specifications, dict)) else {}
        if value is None:
            specs.pop(key, None)
        else:
            specs[key] = value
        self.specifications = specs
        flag_modified(self, "specifications")

    @property
    def status(self) -> PropertyStatus:
        return PropertyStatus.PUBLISHED if self.is_active else PropertyStatus.DRAFT

    @status.setter
    def status(self, value: PropertyStatus | str) -> None:
        val_str = str(value.value if hasattr(value, "value") else value).upper()
        self.is_active = val_str == "PUBLISHED"

    @property
    def city(self) -> str:
        return self._get_spec("city") or "Hyderabad"

    @city.setter
    def city(self, value) -> None:
        self._set_spec("city", str(value) if value is not None else None)

    @property
    def location_text(self) -> str | None:
        return self._get_spec("location_text") or self.short_description or "Hyderabad"

    @location_text.setter
    def location_text(self, value) -> None:
        if value is not None:
            self.short_description = str(value)
        self._set_spec("location_text", str(value) if value is not None else None)

    @property
    def spec_a(self) -> str | None:
        val = self._get_spec("spec_a")
        if val:
            return val
        if self.configuration:
            return self.configuration
        if self.bedrooms:
            return f"{self.bedrooms} BHK"
        return "Luxury Space"

    @spec_a.setter
    def spec_a(self, value) -> None:
        if value is not None:
            self.configuration = str(value)
        self._set_spec("spec_a", str(value) if value is not None else None)

    @property
    def spec_b(self) -> str | None:
        val = self._get_spec("spec_b")
        if val:
            return val
        if self.built_up_area:
            return f"{int(self.built_up_area):,} Sq.Ft."
        if self.plot_size:
            return f"{int(self.plot_size):,} Sq.Yds."
        return "Spacious"

    @spec_b.setter
    def spec_b(self, value) -> None:
        self._set_spec("spec_b", str(value) if value is not None else None)

    @property
    def beds_options(self) -> list[str]:
        val = self._get_spec("beds_options")
        if val is not None and isinstance(val, list):
            return val
        if self.bedrooms:
            return [f"{self.bedrooms} BHK"]
        return []

    @beds_options.setter
    def beds_options(self, value) -> None:
        self._set_spec("beds_options", value if isinstance(value, list) else None)

    @property
    def tag_text(self) -> str:
        val = self._get_spec("tag_text")
        if val:
            return val
        if self.property_type:
            return str(self.property_type.value).upper()
        return "LUXURY"

    @tag_text.setter
    def tag_text(self, value) -> None:
        self._set_spec("tag_text", str(value) if value is not None else None)

    @property
    def status_text(self) -> str:
        val = self._get_spec("status_text")
        if val:
            return val
        return "READY TO MOVE" if self.is_active else "UPCOMING"

    @status_text.setter
    def status_text(self, value) -> None:
        self._set_spec("status_text", str(value) if value is not None else None)

    @property
    def budget_bracket(self) -> BudgetBracket | None:
        val = self._get_spec("budget_bracket")
        if val:
            try:
                return BudgetBracket(val)
            except ValueError:
                pass
        if not self.price_value:
            return BudgetBracket.UNDER_2
        if self.price_value < 20000000:
            return BudgetBracket.UNDER_2
        elif self.price_value <= 50000000:
            return BudgetBracket.RANGE_2_TO_5
        elif self.price_value <= 100000000:
            return BudgetBracket.RANGE_5_TO_10
        else:
            return BudgetBracket.OVER_10

    @budget_bracket.setter
    def budget_bracket(self, value) -> None:
        val_str = str(value.value if hasattr(value, "value") else value) if value is not None else None
        self._set_spec("budget_bracket", val_str)

    @property
    def featured_image_media_id(self) -> str | None:
        val = self._get_spec("featured_image_media_id")
        if val:
            return val
        if self.gallery and len(self.gallery) > 0:
            return self.gallery[0].media_id
        return None

    @featured_image_media_id.setter
    def featured_image_media_id(self, value) -> None:
        self._set_spec("featured_image_media_id", str(value) if value is not None else None)

    @property
    def area_sqft(self) -> Decimal | None:
        val = self._get_spec("area_sqft")
        if val is not None:
            try:
                return Decimal(str(val))
            except Exception:
                pass
        return self.built_up_area or self.carpet_area or self.plot_size

    @area_sqft.setter
    def area_sqft(self, value) -> None:
        if value is not None:
            try:
                dec = Decimal(str(value))
                self.built_up_area = dec
            except Exception:
                pass
        self._set_spec("area_sqft", str(value) if value is not None else None)

    @property
    def brochure_media_id(self) -> str | None:
        return self._get_spec("brochure_media_id")

    @brochure_media_id.setter
    def brochure_media_id(self, value) -> None:
        self._set_spec("brochure_media_id", str(value) if value is not None else None)
