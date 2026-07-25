import { apiFetch } from "@/lib/api-client";
import type { Permission, Role } from "@/types/auth";

export const rolesService = {
  list: () => apiFetch<Role[]>("/api/v1/roles"),

  create: (payload: { name: string; description?: string }) =>
    apiFetch<Role>("/api/v1/roles", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: { name?: string; description?: string }) =>
    apiFetch<Role>(`/api/v1/roles/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/roles/${id}`, { method: "DELETE" }),

  updatePermissions: (id: string, permissionIds: string[]) =>
    apiFetch<Role>(`/api/v1/roles/${id}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permission_ids: permissionIds }),
    }),

  listPermissions: () => apiFetch<Permission[]>("/api/v1/permissions"),
};
