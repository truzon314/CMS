import { apiFetchPage, apiFetch } from "@/lib/api-client";
import type { TrashEntityType, TrashItem } from "@/types/trash";

export const trashService = {
  list: (params: { entityType?: TrashEntityType; page?: number; perPage?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.entityType) query.set("entity_type", params.entityType);
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    return apiFetchPage<TrashItem[]>(`/api/v1/trash?${query.toString()}`);
  },

  restore: (entityType: TrashEntityType, id: string) =>
    apiFetch<{ restored: boolean }>(`/api/v1/trash/${entityType}/${id}/restore`, { method: "POST" }),
};
