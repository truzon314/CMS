"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/useTaxonomy";
import { CategoryEditorDialog } from "@/modules/taxonomy/CategoryEditorDialog";
import type { Category } from "@/types/taxonomy";

const APPLIES_TO_LABEL: Record<Category["applies_to"], string> = {
  blog: "Blog",
  property: "Property",
  both: "Both",
};

export function CategoriesListPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editorCategory, setEditorCategory] = useState<Category | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const columns: ColumnDef<Category>[] = [
    { id: "name", header: "Name", cell: (c) => c.name },
    { id: "slug", header: "Slug", cell: (c) => c.slug },
    { id: "applies_to", header: "Applies to", cell: (c) => <Badge variant="outline">{APPLIES_TO_LABEL[c.applies_to]}</Badge> },
    {
      id: "actions",
      header: "",
      cell: (c) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPendingDelete(c);
          }}
          className="text-neutral-400 hover:text-destructive"
          aria-label={`Delete ${c.name}`}
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Categories</h1>
        <Button onClick={() => setEditorCategory(null)}>
          <Plus size={16} />
          New Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories ?? []}
        isLoading={isLoading}
        getRowId={(c) => c.id}
        onRowClick={(c) => setEditorCategory(c)}
        emptyTitle="No categories yet"
      />

      <CategoryEditorDialog
        key={editorCategory?.id ?? "new"}
        open={editorCategory !== undefined}
        isLoading={createCategory.isPending || updateCategory.isPending}
        category={editorCategory}
        onClose={() => setEditorCategory(undefined)}
        onSave={async (payload) => {
          if (editorCategory) {
            await updateCategory.mutateAsync({ id: editorCategory.id, payload });
          } else {
            await createCategory.mutateAsync(payload);
          }
          setEditorCategory(undefined);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.name}"?`}
        description="Categories assigned to posts or properties can't be deleted — reassign them first."
        variant="destructive"
        confirmLabel="Delete"
        isLoading={deleteCategory.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          // The mutation's own `onError` (useTaxonomy.ts) already shows a toast with the
          // server's message — this catch exists only to stop `mutateAsync` rejecting
          // into an unhandled promise rejection (Next's "Runtime Error" overlay).
          try {
            await deleteCategory.mutateAsync(pendingDelete.id);
          } catch {
            // already toasted by the mutation
          } finally {
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
