import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Menu(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "menus"

    key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)


class MenuItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "menu_items"

    menu_id: Mapped[str] = mapped_column(
        "menuId", String, ForeignKey("menus.id", ondelete="CASCADE"), nullable=False
    )
    parent_item_id: Mapped[str | None] = mapped_column(
        "parentItemId", String, ForeignKey("menu_items.id", ondelete="CASCADE"), default=None
    )
    label: Mapped[str] = mapped_column(String(150), nullable=False)
    url: Mapped[str | None] = mapped_column(String(500), default=None)
    page_id: Mapped[str | None] = mapped_column("pageId", String, default=None)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_external: Mapped[bool] = mapped_column("isExternal", Boolean, default=False)
    open_in_new_tab: Mapped[bool] = mapped_column("openInNewTab", Boolean, default=False)

