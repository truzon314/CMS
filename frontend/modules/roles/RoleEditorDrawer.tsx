"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { AppDrawer } from "@/components/ui/app-drawer";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import { PermissionMatrix } from "@/components/ui/permission-matrix";
import { useCreateRole, usePermissionsList, useUpdateRolePermissions } from "@/hooks/useRoles";
import type { Role } from "@/types/auth";

interface RoleEditorForm {
  name: string;
  description: string;
}

interface RoleEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  role?: Role | null;
}

export function RoleEditorDrawer({ open, onClose, role }: RoleEditorDrawerProps) {
  const isEditing = !!role;
  const isSystem = !!role?.is_system;
  const { data: permissions } = usePermissionsList();
  const createRole = useCreateRole();
  const updatePermissions = useUpdateRolePermissions();
  // Seeded once per mount from `role` — RolesPage remounts this component
  // (via `key`) whenever the target role changes, so an effect-based reset
  // isn't needed (React's recommended pattern for "reset state on prop change").
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(role?.permissions.map((p) => p.id) ?? [])
  );

  const { register, handleSubmit } = useForm<RoleEditorForm>({
    defaultValues: { name: role?.name ?? "", description: role?.description ?? "" },
  });

  async function onSubmit(values: RoleEditorForm) {
    if (isSystem) {
      onClose();
      return;
    }

    if (isEditing && role) {
      await updatePermissions.mutateAsync({ id: role.id, permissionIds: Array.from(selectedIds) });
    } else {
      const created = await createRole.mutateAsync(values);
      if (selectedIds.size > 0) {
        await updatePermissions.mutateAsync({ id: created.id, permissionIds: Array.from(selectedIds) });
      }
    }
    onClose();
  }

  const isSaving = createRole.isPending || updatePermissions.isPending;

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit ${role?.name}` : "New Role"}
      width="lg"
      footer={
        isSystem ? (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-5 py-4">
        {isSystem ? (
          <p className="rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
            System roles can&apos;t be edited or deleted.
          </p>
        ) : null}

        <form className="flex flex-col gap-4">
          <TextField label="Name" disabled={isEditing || isSystem} {...register("name", { required: !isEditing })} />
          <TextField label="Description" disabled={isSystem} {...register("description")} />
        </form>

        <div>
          <div className="mb-2 text-sm font-medium">Permissions</div>
          <PermissionMatrix
            permissions={permissions ?? []}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            readOnly={isSystem}
          />
        </div>
      </div>
    </AppDrawer>
  );
}
