"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/forms/SelectField";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { useRestoreTrashItem, useTrashList } from "@/hooks/useTrash";
import type { TrashEntityType, TrashItem } from "@/types/trash";

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "blog_post", label: "Blog posts" },
  { value: "property", label: "Properties" },
  { value: "media", label: "Media" },
];

const ENTITY_LABELS: Record<TrashEntityType, string> = {
  blog_post: "Blog post",
  property: "Property",
  media: "Media",
};

export function TrashPage() {
  const [entityType, setEntityType] = useState("");
  const { data, isLoading } = useTrashList({
    entityType: (entityType || undefined) as TrashEntityType | undefined,
  });
  const restore = useRestoreTrashItem();

  const items = data?.data ?? [];

  const columns: ColumnDef<TrashItem>[] = [
    { id: "title", header: "Name", cell: (i) => i.title },
    { id: "entity_type", header: "Type", cell: (i) => ENTITY_LABELS[i.entity_type] },
    { id: "deleted_at", header: "Deleted", cell: (i) => new Date(i.deleted_at).toLocaleString() },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (i) => (
        <Button
          size="sm"
          variant="outline"
          disabled={restore.isPending}
          onClick={(e) => {
            e.stopPropagation();
            restore.mutate({ entityType: i.entity_type, id: i.id });
          }}
        >
          <RotateCcw size={13} />
          Restore
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Trash</h1>

      <div className="w-56">
        <SelectField
          label=""
          ariaLabel="Filter by entity type"
          id="trash_entity_filter"
          value={entityType}
          onChange={setEntityType}
          options={ENTITY_TYPE_OPTIONS}
        />
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(i) => `${i.entity_type}:${i.id}`}
        emptyTitle="Trash is empty"
        emptyDescription="Deleted blog posts, properties, and media files show up here and can be restored."
      />
    </div>
  );
}
