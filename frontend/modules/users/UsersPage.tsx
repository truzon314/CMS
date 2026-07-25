"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { useUsers } from "@/hooks/useUsers";
import { UserEditorDrawer } from "@/modules/users/UserEditorDrawer";
import type { User } from "@/types/user";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [drawerUser, setDrawerUser] = useState<User | null | undefined>(undefined);
  const { data, isLoading } = useUsers({ search: search || undefined });

  const columns: ColumnDef<User>[] = [
    { id: "name", header: "Name", cell: (u) => u.full_name },
    { id: "email", header: "Email", cell: (u) => u.email },
    { id: "role", header: "Role", cell: (u) => u.role.name },
    {
      id: "status",
      header: "Status",
      cell: (u) => (
        <Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "Active" : "Inactive"}</Badge>
      ),
    },
    {
      id: "last_login",
      header: "Last login",
      cell: (u) => (u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Never"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Users</h1>
        <Button onClick={() => setDrawerUser(null)}>
          <Plus size={16} />
          Invite User
        </Button>
      </div>

      <Input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        getRowId={(u) => u.id}
        onRowClick={(u) => setDrawerUser(u)}
        emptyTitle="No users yet"
        emptyDescription="Invite your first teammate to get started."
      />

      <UserEditorDrawer
        key={drawerUser?.id ?? "new"}
        open={drawerUser !== undefined}
        onClose={() => setDrawerUser(undefined)}
        user={drawerUser}
      />
    </div>
  );
}
