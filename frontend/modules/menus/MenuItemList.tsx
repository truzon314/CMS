"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItemRow } from "@/modules/menus/MenuItemRow";
import { newMenuItemDraft, type MenuItemDraft } from "@/modules/menus/types";

interface MenuItemListProps {
  items: MenuItemDraft[];
  onChange: (items: MenuItemDraft[]) => void;
  depth: number;
}

/** One reorderable level of the menu tree — top-level items and each item's
 * children each get their own independent drag scope (no drag-between-levels,
 * a deliberate scope cut; see MenuEditorPage). */
export function MenuItemList({ items, onChange, depth }: MenuItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.clientId === active.id);
    const newIndex = items.findIndex((i) => i.clientId === over.id);
    onChange(arrayMove(items, oldIndex, newIndex));
  }

  function updateItem(clientId: string, patch: Partial<MenuItemDraft>) {
    onChange(items.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)));
  }

  function removeItem(clientId: string) {
    onChange(items.filter((item) => item.clientId !== clientId));
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.clientId)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <MenuItemRow
                key={item.clientId}
                item={item}
                depth={depth}
                onChange={(patch) => updateItem(item.clientId, patch)}
                onRemove={() => removeItem(item.clientId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange([...items, newMenuItemDraft()])}
      >
        <Plus size={14} />
        {depth === 0 ? "Add item" : "Add sub-item"}
      </Button>
    </div>
  );
}
