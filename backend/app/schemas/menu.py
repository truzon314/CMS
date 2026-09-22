
from pydantic import BaseModel, ConfigDict


class MenuItemInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    url: str | None = None
    page_id: str | None = None
    is_external: bool = False
    open_in_new_tab: bool = False
    children: list["MenuItemInput"] = []


MenuItemInput.model_rebuild()


class MenuItemsReplaceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[MenuItemInput]


class MenuItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str
    url: str | None
    page_id: str | None
    position: int
    is_external: bool
    open_in_new_tab: bool
    children: list["MenuItemRead"] = []


MenuItemRead.model_rebuild()


class MenuRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    label: str
    items: list[MenuItemRead]


class MenuListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    label: str
