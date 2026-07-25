import { apiFetch } from "@/lib/api-client";
import type { Menu, MenuItemInput, MenuListItem } from "@/types/menu";

export const menuService = {
  list: () => apiFetch<MenuListItem[]>("/api/v1/menus"),

  get: (key: string) => apiFetch<Menu>(`/api/v1/menus/${key}`),

  replaceItems: (key: string, items: MenuItemInput[]) =>
    apiFetch<Menu>(`/api/v1/menus/${key}/items`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
};
