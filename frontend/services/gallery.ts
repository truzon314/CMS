import { apiFetch, apiFetchPage } from "@/lib/api-client";
import type { GalleryItem } from "@/types/gallery";

export interface GalleryListParams {
  page?: number;
  perPage?: number;
}

export interface GalleryItemPayload {
  media_id: string;
  caption?: string | null;
  category?: string | null;
  sort_order: number;
  is_published: boolean;
}

export const galleryService = {
  list: (params: GalleryListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    return apiFetchPage<GalleryItem[]>(`/api/v1/gallery?${query.toString()}`);
  },

  create: (payload: GalleryItemPayload) =>
    apiFetch<GalleryItem>("/api/v1/gallery", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<GalleryItemPayload>) =>
    apiFetch<GalleryItem>(`/api/v1/gallery/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id: string) => apiFetch<null>(`/api/v1/gallery/${id}`, { method: "DELETE" }),
};
