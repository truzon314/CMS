"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMenu, useReplaceMenuItems } from "@/hooks/useMenus";
import { MenuItemList } from "@/modules/menus/MenuItemList";
import type { MenuItemDraft } from "@/modules/menus/types";
import type { Menu, MenuItem, MenuItemInput } from "@/types/menu";

interface MenuEditorPageProps {
  menuKey: string;
}

function toDraft(item: MenuItem): MenuItemDraft {
  return {
    clientId: item.id,
    label: item.label,
    linkType: item.page_id ? "page" : "url",
    pageId: item.page_id,
    url: item.url ?? "",
    openInNewTab: item.open_in_new_tab,
    children: item.children.map(toDraft),
  };
}

function toInput(draft: MenuItemDraft): MenuItemInput {
  return {
    label: draft.label,
    url: draft.linkType === "url" ? draft.url : null,
    page_id: draft.linkType === "page" ? draft.pageId : null,
    is_external: draft.linkType === "url",
    open_in_new_tab: draft.linkType === "url" ? draft.openInNewTab : false,
    children: draft.children.map(toInput),
  };
}

export function MenuEditorPage({ menuKey }: MenuEditorPageProps) {
  const { data: menu, isLoading } = useMenu(menuKey);
  const replaceItems = useReplaceMenuItems(menuKey);

  if (isLoading || !menu) {
    return <div className="h-40 animate-pulse rounded-lg border bg-neutral-100" />;
  }

  return (
    <MenuEditorBody
      key={menu.id}
      menu={menu}
      isSaving={replaceItems.isPending}
      onSave={(items) => replaceItems.mutate(items)}
    />
  );
}

interface MenuEditorBodyProps {
  menu: Menu;
  isSaving: boolean;
  onSave: (items: MenuItemInput[]) => void;
}

function MenuEditorBody({ menu, isSaving, onSave }: MenuEditorBodyProps) {
  const [items, setItems] = useState<MenuItemDraft[]>(() => menu.items.map(toDraft));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/menus" className="text-neutral-400 hover:text-neutral-700">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-lg font-semibold">{menu.label}</h1>
      </div>

      <MenuItemList items={items} onChange={setItems} depth={0} />

      <Button disabled={isSaving} className="self-start" onClick={() => onSave(items.map(toInput))}>
        {isSaving ? "Saving…" : "Save Menu"}
      </Button>
    </div>
  );
}
