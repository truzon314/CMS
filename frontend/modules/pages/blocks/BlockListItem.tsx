"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockDefinition, PageBlock } from "@/types/page";

interface BlockListItemProps {
  block: PageBlock;
  definition: BlockDefinition | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function BlockListItem({ block, definition, isSelected, onSelect, onDelete }: BlockListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-white px-2.5 py-2 text-sm",
        isSelected && "border-neutral-900",
        isDragging && "opacity-50"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-neutral-400 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={15} />
      </button>
      <button type="button" onClick={onSelect} className="flex-1 truncate text-left">
        {definition?.label ?? "Block"}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="text-neutral-400 hover:text-destructive"
        aria-label="Remove block"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
