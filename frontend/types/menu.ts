export interface MenuItem {
  id: string;
  label: string;
  url: string | null;
  page_id: string | null;
  position: number;
  is_external: boolean;
  open_in_new_tab: boolean;
  children: MenuItem[];
}

export interface Menu {
  id: string;
  key: string;
  label: string;
  items: MenuItem[];
}

export interface MenuListItem {
  id: string;
  key: string;
  label: string;
}

export interface MenuItemInput {
  label: string;
  url?: string | null;
  page_id?: string | null;
  is_external?: boolean;
  open_in_new_tab?: boolean;
  children: MenuItemInput[];
}
