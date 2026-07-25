"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePagesList } from "@/hooks/usePages";
import { cn } from "@/lib/utils";
import { MenuItemList } from "@/modules/menus/MenuItemList";
import type { MenuItemDraft } from "@/modules/menus/types";

interface MenuItemRowProps {
  item: MenuItemDraft;
  depth: number;
  onChange: (patch: Partial<MenuItemDraft>) => void;
  onRemove: () => void;
}

const LINK_TYPE_OPTIONS = [
  { value: "page", label: "One of the 5 Pages" },
  { value: "url", label: "Custom URL" },
];

export function MenuItemRow({ item, depth, onChange, onRemove }: MenuItemRowProps) {
  const { data: pages } = usePagesList();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.clientId,
  });

  const pageOptions = (pages ?? []).map((p) => ({ value: p.id, label: p.title }));

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex flex-col gap-2 rounded-md border bg-white p-3", isDragging && "opacity-50")}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab text-neutral-400 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical size={15} />
        </button>

        <div className="flex flex-1 flex-col gap-2">
          <TextField
            id={`menu_item_label_${item.clientId}`}
            label="Label"
            value={item.label}
            onChange={(e) => onChange({ label: e.target.value })}
          />

          <SelectField
            id={`menu_item_link_type_${item.clientId}`}
            label="Links to"
            value={item.linkType}
            onChange={(v) => onChange({ linkType: v as "page" | "url" })}
            options={LINK_TYPE_OPTIONS}
          />

          {item.linkType === "page" ? (
            <SelectField
              id={`menu_item_page_${item.clientId}`}
              label="Page"
              value={item.pageId ?? ""}
              onChange={(v) => onChange({ pageId: v || null })}
              options={pageOptions}
            />
          ) : (
            <>
              <TextField
                id={`menu_item_url_${item.clientId}`}
                label="URL"
                placeholder="https://..."
                value={item.url}
                onChange={(e) => onChange({ url: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`menu_item_new_tab_${item.clientId}`}
                  checked={item.openInNewTab}
                  onCheckedChange={(checked) => onChange({ openInNewTab: checked === true })}
                />
                <Label htmlFor={`menu_item_new_tab_${item.clientId}`} className="font-normal">
                  Open in new tab
                </Label>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-neutral-400 hover:text-destructive"
          aria-label={`Remove ${item.label || "item"}`}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="ml-6 border-l pl-4">
        <MenuItemList items={item.children} onChange={(children) => onChange({ children })} depth={depth + 1} />
      </div>
    </div>
  );
}
