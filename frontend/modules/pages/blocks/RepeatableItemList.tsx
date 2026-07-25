import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RepeatableItemListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  addLabel: string;
  itemLabel: (index: number) => string;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}

/** Shared add/remove-by-index list editor behind every repeatable-item block
 * (Gallery, Testimonials, Features, Pricing, Team, Timeline, Accordion,
 * Statistics) — same interaction FaqBlockEditor established in Phase 2. */
export function RepeatableItemList<T>({
  items,
  onChange,
  newItem,
  addLabel,
  itemLabel,
  renderItem,
}: RepeatableItemListProps<T>) {
  function updateItem(index: number, patch: Partial<T>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{itemLabel(index)}</span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-neutral-400 hover:text-destructive"
              aria-label={`Remove ${itemLabel(index)}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
          {renderItem(item, (patch) => updateItem(index, patch), index)}
        </div>
      ))}

      <Button type="button" variant="outline" onClick={() => onChange([...items, newItem()])}>
        <Plus size={14} />
        {addLabel}
      </Button>
    </div>
  );
}
