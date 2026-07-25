import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Menu(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Fixed set of 5 keys (header, footer_company, footer_properties,
    footer_resources, footer_legal) — same "fixed rows, not free CRUD" pattern
    as `Page.page_type` (ERD.md). No ORM relationship to `MenuItem` — the tree
    is shallow and always fetched/rebuilt as a flat list by
    `MenuRepository`, then assembled into a tree in Python (simpler and more
    predictable than a self-referential ORM relationship at arbitrary depth)."""

    __tablename__ = "menu"

    key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)


class MenuItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "menu_item"

    menu_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu.id", ondelete="CASCADE"), nullable=False
    )
    parent_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_item.id", ondelete="CASCADE"), default=None
    )
    label: Mapped[str] = mapped_column(String(150), nullable=False)
    url: Mapped[str | None] = mapped_column(String(500), default=None)
    # No FK constraint — mirrors `Page.featured_image_media_id`'s pattern of a
    # soft reference where the referenced table's identity matters more than a
    # DB-level constraint (here: one of the 5 fixed Page rows).
    page_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), default=None)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_external: Mapped[bool] = mapped_column(Boolean, default=False)
    open_in_new_tab: Mapped[bool] = mapped_column(Boolean, default=False)
