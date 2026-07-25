"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteRole, useRolesList } from "@/hooks/useRoles";
import { RoleEditorDrawer } from "@/modules/roles/RoleEditorDrawer";
import type { Role } from "@/types/auth";

export function RolesPage() {
  const { data: roles, isLoading } = useRolesList();
  const deleteRole = useDeleteRole();
  const [drawerRole, setDrawerRole] = useState<Role | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null);

  const columns: ColumnDef<Role>[] = [
    { id: "name", header: "Name", cell: (r) => r.name },
    { id: "description", header: "Description", cell: (r) => r.description ?? "—" },
    { id: "permissions", header: "Permissions", cell: (r) => `${r.permissions.length} granted` },
    {
      id: "type",
      header: "Type",
      cell: (r) => (r.is_system ? <Badge variant="secondary">System</Badge> : <Badge variant="outline">Custom</Badge>),
    },
    {
      id: "actions",
      header: "",
      cell: (r) =>
        r.is_system ? null : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPendingDelete(r);
            }}
            className="text-neutral-400 hover:text-destructive"
            aria-label={`Delete ${r.name}`}
          >
            <Trash2 size={15} />
          </button>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Roles</h1>
        <Button onClick={() => setDrawerRole(null)}>
          <Plus size={16} />
          New Role
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={roles ?? []}
        isLoading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => setDrawerRole(r)}
        emptyTitle="No roles yet"
      />

      <RoleEditorDrawer
        key={drawerRole?.id ?? "new"}
        open={drawerRole !== undefined}
        onClose={() => setDrawerRole(undefined)}
        role={drawerRole}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.name}"?`}
        description="Users with this role must be reassigned first. This can't be undone."
        variant="destructive"
        confirmLabel="Delete"
        isLoading={deleteRole.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteRole.mutateAsync(pendingDelete.id);
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
