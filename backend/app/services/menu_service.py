import uuid

from app.shared.exceptions.exceptions import NotFoundError
from app.domain.repositories.menu_repository import MenuRepository
from app.models.menu import Menu, MenuItem
from app.schemas.menu import MenuItemInput, MenuItemRead, MenuRead
from app.services.audit_service import AuditService


class MenuService:
    def __init__(self, menus: MenuRepository, audit: AuditService):
        self.menus = menus
        self.audit = audit

    async def list_menus(self) -> list[Menu]:
        return await self.menus.list_all()

    async def get_menu(self, key: str) -> MenuRead:
        menu = await self._get_menu_row(key)
        items = await self.menus.list_items(menu.id)
        return MenuRead(id=menu.id, key=menu.key, label=menu.label, items=self._build_tree(items, None))

    async def replace_items(
        self, key: str, items: list[MenuItemInput], actor_id: uuid.UUID | None = None
    ) -> MenuRead:
        menu = await self._get_menu_row(key)
        await self.menus.delete_all_items(menu.id)
        await self._insert_tree(menu.id, items, None)
        await self.audit.log(actor_id, "menu.update", "menu", menu.id, details={"key": menu.key})
        return await self.get_menu(key)

    async def _get_menu_row(self, key: str) -> Menu:
        menu = await self.menus.get_by_key(key)
        if not menu:
            raise NotFoundError("Menu not found.")
        return menu

    async def _insert_tree(
        self, menu_id: uuid.UUID, items: list[MenuItemInput], parent_item_id: uuid.UUID | None
    ) -> None:
        for position, item_input in enumerate(items):
            item = MenuItem(
                menu_id=menu_id,
                parent_item_id=parent_item_id,
                label=item_input.label,
                url=item_input.url,
                page_id=item_input.page_id,
                position=position,
                is_external=item_input.is_external,
                open_in_new_tab=item_input.open_in_new_tab,
            )
            created = await self.menus.create_item(item)
            await self._insert_tree(menu_id, item_input.children, created.id)

    @staticmethod
    def _build_tree(items: list[MenuItem], parent_item_id: uuid.UUID | None) -> list[MenuItemRead]:
        children = [item for item in items if item.parent_item_id == parent_item_id]
        return [
            MenuItemRead(
                id=item.id,
                label=item.label,
                url=item.url,
                page_id=item.page_id,
                position=item.position,
                is_external=item.is_external,
                open_in_new_tab=item.open_in_new_tab,
                children=MenuService._build_tree(items, item.id),
            )
            for item in children
        ]
