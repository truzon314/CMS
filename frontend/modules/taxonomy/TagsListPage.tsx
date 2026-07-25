"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { useCreateTag, useDeleteTag, useTags, useUpdateTag } from "@/hooks/useTaxonomy";
import { TagEditorDialog } from "@/modules/taxonomy/TagEditorDialog";
import type { Tag } from "@/types/taxonomy";

export function TagsListPage() {
  const { data: tags, isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [editorTag, setEditorTag] = useState<Tag | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);

  const columns: ColumnDef<Tag>[] = [
    { id: "name", header: "Name", cell: (t) => t.name },
    { id: "slug", header: "Slug", cell: (t) => t.slug },
    {
      id: "actions",
      header: "",
      cell: (t) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPendingDelete(t);
          }}
          className="text-neutral-400 hover:text-destructive"
          aria-label={`Delete ${t.name}`}
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Tags</h1>
        <Button onClick={() => setEditorTag(null)}>
          <Plus size={16} />
          New Tag
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tags ?? []}
        isLoading={isLoading}
        getRowId={(t) => t.id}
        onRowClick={(t) => setEditorTag(t)}
        emptyTitle="No tags yet"
      />

      <TagEditorDialog
        key={editorTag?.id ?? "new"}
        open={editorTag !== undefined}
        isLoading={createTag.isPending || updateTag.isPending}
        tag={editorTag}
        onClose={() => setEditorTag(undefined)}
        onSave={async (payload) => {
          if (editorTag) {
            await updateTag.mutateAsync({ id: editorTag.id, payload });
          } else {
            await createTag.mutateAsync(payload);
          }
          setEditorTag(undefined);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.name}"?`}
        description="Tags assigned to posts can't be deleted — reassign them first."
        variant="destructive"
        confirmLabel="Delete"
        isLoading={deleteTag.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteTag.mutateAsync(pendingDelete.id);
          } catch {
            // already toasted by the mutation's own onError
          } finally {
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
