"use client";

import { useMemo, useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/useTaxonomy";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Lets an admin add/delete the property-type options shown as filter chips on
 * the public site's Projects page (my-app fetches these live from
 * `GET /public/categories?applies_to=property`, so changes here reflect
 * immediately — no separate "type" concept, these are just Category rows
 * scoped to `applies_to: "property"`).
 */
export function PropertyTypesPanel() {
  const { data: types, isLoading } = useCategories("property");
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const existingNames = useMemo(
    () => new Set((types ?? []).map((t) => t.name.trim().toLowerCase())),
    [types]
  );

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (existingNames.has(name.toLowerCase())) {
      setNameError("A property type with this name already exists.");
      return;
    }
    await createCategory.mutateAsync({ name, slug: slugify(name), applies_to: "property" });
    setNewName("");
    setNameError(null);
    setAdding(false);
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await deleteCategory.mutateAsync(id);
      } catch {
        // Force-deletes regardless of usage (properties keep their other
        // types, they just lose this one) — useDeleteCategory already toasts
        // on genuinely unexpected failures; keep going for the rest.
      }
    }
    setSelectedIds(new Set());
    setConfirmingDelete(false);
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Tag size={15} className="text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-900">Property Types</h2>
          <span className="text-xs text-neutral-500">shown as filters on the public Projects page</span>
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 size={14} className="mr-1.5" />
            Delete Selected ({selectedIds.size})
          </Button>
        )}
      </div>

      <div className="flex flex-col divide-y">
        {isLoading && <div className="px-4 py-3 text-sm text-neutral-500">Loading…</div>}

        {!isLoading && (types ?? []).length === 0 && !adding && (
          <div className="px-4 py-3 text-sm text-neutral-500">No property types yet — add one below.</div>
        )}

        {(types ?? []).map((type) => (
          <label
            key={type.id}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-neutral-50"
          >
            <Checkbox
              checked={selectedIds.has(type.id)}
              onCheckedChange={() => toggleSelected(type.id)}
            />
            <span className="text-sm text-neutral-800">{type.name}</span>
          </label>
        ))}
      </div>

      <div className="border-t p-3">
        {adding ? (
          <form onSubmit={handleAddSubmit} className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                autoFocus
                placeholder="e.g. Villa"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNameError(null);
                }}
              />
              {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
            </div>
            <Button type="submit" size="sm" disabled={createCategory.isPending || !newName.trim()}>
              {createCategory.isPending ? "Adding…" : "Add"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAdding(false);
                setNewName("");
                setNameError(null);
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus size={14} className="mr-1.5" />
            Add Property Type
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={`Delete ${selectedIds.size} property type${selectedIds.size === 1 ? "" : "s"}?`}
        description="They'll disappear from the public site's filter immediately. Any properties using them will just lose that type — nothing else about them changes."
        variant="destructive"
        confirmLabel="Delete"
        isLoading={deleteCategory.isPending}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={handleDeleteSelected}
      />
    </div>
  );
}
