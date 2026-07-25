"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { AppDrawer } from "@/components/ui/app-drawer";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import { SelectField } from "@/components/forms/SelectField";
import { useCreateUser, useUpdateUser } from "@/hooks/useUsers";
import { useRolesList } from "@/hooks/useRoles";
import type { User } from "@/types/user";

interface UserEditorForm {
  email: string;
  full_name: string;
}

interface UserEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
}

export function UserEditorDrawer({ open, onClose, user }: UserEditorDrawerProps) {
  const isEditing = !!user;
  const { data: roles } = useRolesList();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  // Seeded once per mount — the parent remounts this via `key` when the
  // target user changes, so no effect-based reset is needed.
  const [roleId, setRoleId] = useState(user?.role.id ?? "");

  const { register, handleSubmit } = useForm<UserEditorForm>({
    defaultValues: { email: user?.email ?? "", full_name: user?.full_name ?? "" },
  });

  async function onSubmit(values: UserEditorForm) {
    if (isEditing && user) {
      await updateUser.mutateAsync({ id: user.id, payload: { full_name: values.full_name, role_id: roleId } });
    } else {
      await createUser.mutateAsync({ ...values, role_id: roleId });
    }
    onClose();
  }

  const isSaving = createUser.isPending || updateUser.isPending;

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit User" : "Invite User"}
      description={isEditing ? undefined : "They'll get a link to set their own password."}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? "Saving…" : isEditing ? "Save changes" : "Send invite"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-4">
        <TextField
          label="Email"
          type="email"
          disabled={isEditing}
          {...register("email", { required: !isEditing })}
        />
        <TextField label="Full name" {...register("full_name", { required: true })} />
        <SelectField
          id="role_id"
          label="Role"
          value={roleId}
          onChange={setRoleId}
          options={(roles ?? []).map((r) => ({ value: r.id, label: r.name }))}
          placeholder="Select a role"
        />
      </form>
    </AppDrawer>
  );
}
