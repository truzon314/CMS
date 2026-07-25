import { apiFetch, apiFetchPage } from "@/lib/api-client";
import type { User, UserCreateInput, UserUpdateInput } from "@/types/user";

export const usersService = {
  list: (params: { page?: number; perPage?: number; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    if (params.search) query.set("search", params.search);
    return apiFetchPage<User[]>(`/api/v1/users?${query.toString()}`);
  },

  create: (payload: UserCreateInput) =>
    apiFetch<User>("/api/v1/users", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: UserUpdateInput) =>
    apiFetch<User>(`/api/v1/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/users/${id}`, { method: "DELETE" }),

  restore: (id: string) => apiFetch<User>(`/api/v1/users/${id}/restore`, { method: "POST" }),
};
