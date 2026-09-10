from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Menu(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "menus"

    key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String, default=None)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)

    items: Mapped[list["MenuItem"]] = relationship(back_populates="menu", cascade="all, delete-orphan")


class MenuItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "menu_items"

    menu_id: Mapped[str] = mapped_column(
        "menuId", String, ForeignKey("menus.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[str | None] = mapped_column(
        "parentId", String, ForeignKey("menu_items.id", ondelete="CASCADE"), default=None
    )
    label: Mapped[str] = mapped_column(String(150), nullable=False)
    href: Mapped[str | None] = mapped_column(String(500), default=None)
    page_id: Mapped[str | None] = mapped_column("pageId", String, ForeignKey("pages.id"), default=None)
    is_external: Mapped[bool] = mapped_column("isExternal", Boolean, default=False)
    open_in_new_tab: Mapped[bool] = mapped_column("openInNewTab", Boolean, default=False)
    icon: Mapped[str | None] = mapped_column(String(100), default=None)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)

    menu: Mapped["Menu"] = relationship(back_populates="items")
    parent: Mapped["MenuItem | None"] = relationship("MenuItem", remote_side="MenuItem.id", backref="children")

    @property
    def parent_item_id(self) -> str | None:
        return self.parent_id

    @parent_item_id.setter
    def parent_item_id(self, value: str | None) -> None:
        self.parent_id = value

    @property
    def url(self) -> str | None:
        return self.href

    @url.setter
    def url(self, value: str | None) -> None:
        self.href = value


