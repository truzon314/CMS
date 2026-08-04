"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateProperty, useDeleteProperty, usePropertiesList, useReorderProperties } from "@/hooks/useProperties";
import { NewPropertyDialog } from "@/modules/properties/NewPropertyDialog";
import { PropertyRow } from "@/modules/properties/PropertyRow";
import { PropertyTypesPanel } from "@/modules/properties/PropertyTypesPanel";
import type { PropertyListItem } from "@/types/property";

export function PropertiesListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [newPropertyOpen, setNewPropertyOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PropertyListItem | null>(null);
  const createProperty = useCreateProperty();
  const deleteProperty = useDeleteProperty();
  const reorderProperties = useReorderProperties();

  // Backend caps per_page at 100 (`Query(20, ge=1, le=100)`) — pull the max
  // so the whole list loads on one page. Reordering only makes sense
  // against the complete, unfiltered set, and this page has no pagination
  // UI of its own to move between pages while dragging.
  const { data, isLoading } = usePropertiesList({ search: search || undefined, perPage: 100 });

  // Local copy so a drag can reorder instantly (optimistic) instead of
  // waiting on the reorder request + refetch round trip.
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  useEffect(() => {
    if (data?.data) setProperties(data.data);
  }, [data?.data]);

  const dragDisabled = search.trim().length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = properties.findIndex((p) => p.id === active.id);
    const newIndex = properties.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(properties, oldIndex, newIndex);
    setProperties(reordered);
    reorderProperties.mutate(reordered.map((p) => p.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Properties</h1>
        <Button onClick={() => setNewPropertyOpen(true)}>
          <Plus size={16} />
          New Property
        </Button>
      </div>

      <PropertyTypesPanel />

      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-xs text-neutral-500">
          {dragDisabled ? "Clear search to drag-reorder." : "Drag rows to set the order they appear on the public site."}
        </p>
      </div>

      {!isLoading && properties.length === 0 ? (
        <EmptyState title="No properties yet" description="List your first property to get started." />
      ) : (
        // DndContext wraps the whole table rather than sitting inside
        // TableBody — it renders a hidden accessibility announcer <div>
        // internally, which is invalid directly under a <tbody> (only <tr>
        // is allowed there) and triggers a hydration mismatch. SortableContext
        // is a plain context provider with no DOM output of its own, so it's
        // safe to keep scoped to just the row list inside <tbody>.
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="p-2 align-middle">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <SortableContext items={properties.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    {properties.map((p) => (
                      <PropertyRow
                        key={p.id}
                        property={p}
                        dragDisabled={dragDisabled}
                        onClick={() => router.push(`/properties/${p.id}`)}
                        onDelete={() => setPendingDelete(p)}
                      />
                    ))}
                  </SortableContext>
                )}
              </TableBody>
            </Table>
          </div>
        </DndContext>
      )}

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
