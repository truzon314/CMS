from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.core.container import get_menu_service
from app.models.user import User
from app.schemas.common import ok
from app.schemas.menu import MenuItemsReplaceRequest, MenuListItem
from app.services.menu_service import MenuService

router = APIRouter(prefix="/menus", tags=["menus"])


@router.get("")
async def list_menus(
    menu_service: MenuService = Depends(get_menu_service),
    _=Depends(require_permission("settings.manage")),
):
    menus = await menu_service.list_menus()
    return ok([MenuListItem.model_validate(m).model_dump(mode="json") for m in menus])


@router.get("/{key}")
async def get_menu(
    key: str,
    menu_service: MenuService = Depends(get_menu_service),
    _=Depends(require_permission("settings.manage")),
):
    menu = await menu_service.get_menu(key)
    return ok(menu.model_dump(mode="json"))


@router.put("/{key}/items")
async def replace_menu_items(
    key: str,
    payload: MenuItemsReplaceRequest,
    menu_service: MenuService = Depends(get_menu_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("settings.manage")),
):
    menu = await menu_service.replace_items(key, payload.items, user.id)
    return ok(menu.model_dump(mode="json"))
