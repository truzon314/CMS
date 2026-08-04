"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import type { PropertyListItem } from "@/types/property";

interface PropertyRowProps {
  property: PropertyListItem;
  dragDisabled: boolean;
  onClick: () => void;
  onDelete: () => void;
}

// A plain <tr>/<td> row (not the shared DataTable/TableRow, which don't
// forward refs) so dnd-kit's useSortable can attach setNodeRef directly —
// same reason GalleryThumbnail.tsx builds its own row markup instead of
// reusing a shared list primitive. Tailwind classes mirror TableRow/TableCell
// for visual consistency with the rest of the admin's tables.
export function PropertyRow({ property, dragDisabled, onClick, onDelete }: PropertyRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: property.id,
    disabled: dragDisabled,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onClick}
      className={cn(
        "cursor-pointer border-b transition-colors hover:bg-muted/50",
        isDragging && "relative z-10 opacity-50"
      )}
    >
      <td className="w-8 p-2 align-middle">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          disabled={dragDisabled}
          title={dragDisabled ? "Clear search to reorder" : "Drag to reorder"}
          className="cursor-grab text-neutral-400 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Drag to reorder"
        >
          <GripVertical size={15} />
        </button>
      </td>
      <td className="p-2 align-middle">{property.name}</td>
      <td className="p-2 align-middle">{property.city ?? "—"}</td>
      <td className="p-2 align-middle">
        {property.category_names.length ? property.category_names.join(", ") : "—"}
      </td>
      <td className="p-2 align-middle">{property.price_display ?? "—"}</td>
      <td className="p-2 align-middle">
        <StatusPill status={property.status} />
      </td>
      <td className="p-2 align-middle">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-neutral-400 hover:text-destructive"
          aria-label={`Delete ${property.name}`}
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
