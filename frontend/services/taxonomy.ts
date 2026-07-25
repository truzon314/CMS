import { apiFetch } from "@/lib/api-client";
import type { Category, CategoryAppliesTo, Tag } from "@/types/taxonomy";

export const categoriesService = {
  list: (appliesTo?: CategoryAppliesTo) =>
    apiFetch<Category[]>(`/api/v1/categories${appliesTo ? `?applies_to=${appliesTo}` : ""}`),

  create: (payload: { name: string; slug: string; applies_to: CategoryAppliesTo }) =>
    apiFetch<Category>("/api/v1/categories", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: { name?: string; slug?: string; applies_to?: CategoryAppliesTo }) =>
    apiFetch<Category>(`/api/v1/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/categories/${id}`, { method: "DELETE" }),
};

export const tagsService = {
  list: () => apiFetch<Tag[]>("/api/v1/tags"),

  create: (payload: { name: string; slug: string }) =>
    apiFetch<Tag>("/api/v1/tags", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: { name?: string; slug?: string }) =>
    apiFetch<Tag>(`/api/v1/tags/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/tags/${id}`, { method: "DELETE" }),
};
