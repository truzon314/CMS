export interface MenuItemDraft {
  clientId: string;
  label: string;
  linkType: "page" | "url";
  pageId: string | null;
  url: string;
  openInNewTab: boolean;
  children: MenuItemDraft[];
}

export function newMenuItemDraft(): MenuItemDraft {
  return {
    clientId: crypto.randomUUID(),
    label: "",
    linkType: "page",
    pageId: null,
    url: "",
    openInNewTab: false,
    children: [],
  };
}
