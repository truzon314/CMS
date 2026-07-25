"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { useCreateProperty, useDeleteProperty, usePropertiesList } from "@/hooks/useProperties";
import { NewPropertyDialog } from "@/modules/properties/NewPropertyDialog";
import type { PropertyListItem } from "@/types/property";

export function PropertiesListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [newPropertyOpen, setNewPropertyOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PropertyListItem | null>(null);
  const createProperty = useCreateProperty();
  const deleteProperty = useDeleteProperty();

  const { data, isLoading } = usePropertiesList({ search: search || undefined });

  const columns: ColumnDef<PropertyListItem>[] = [
    { id: "name", header: "Name", cell: (p) => p.name },
    { id: "city", header: "City", cell: (p) => p.city ?? "—" },
    { id: "type", header: "Type", cell: (p) => (p.category_names.length ? p.category_names.join(", ") : "—") },
    { id: "price", header: "Price", cell: (p) => p.price_display ?? "—" },
    { id: "status", header: "Status", cell: (p) => <StatusPill status={p.status} /> },
    {
      id: "actions",
      header: "",
      cell: (p) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPendingDelete(p);
          }}
          className="text-neutral-400 hover:text-destructive"
          aria-label={`Delete ${p.name}`}
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Properties</h1>
        <Button onClick={() => setNewPropertyOpen(true)}>
          <Plus size={16} />
          New Property
        </Button>
      </div>

      <Input
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        getRowId={(p) => p.id}
        onRowClick={(p) => router.push(`/properties/${p.id}`)}
        emptyTitle="No properties yet"
        emptyDescription="List your first property to get started."
      />

      <NewPropertyDialog
        open={newPropertyOpen}
        isLoading={createProperty.isPending}
        onClose={() => setNewPropertyOpen(false)}
        onConfirm={async (payload) => {
          const created = await createProperty.mutateAsync(payload);
          setNewPropertyOpen(false);
          router.push(`/properties/${created.id}`);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.name}"?`}
        description="It'll be removed from the public site immediately, but you can restore it from Trash later."
        variant="destructive"
        confirmLabel="Delete"
        isLoading={deleteProperty.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteProperty.mutateAsync(pendingDelete.id);
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
