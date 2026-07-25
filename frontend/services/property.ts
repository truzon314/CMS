import { apiFetch, apiFetchPage } from "@/lib/api-client";
import type { SeoMeta } from "@/types/page";
import type { BudgetBracket, Property, PropertyListItem } from "@/types/property";

export interface PropertyListParams {
  page?: number;
  perPage?: number;
  status?: string;
  city?: string;
  type?: string;
  budgetBracket?: string;
  search?: string;
}

export interface PropertyCreatePayload {
  name: string;
  slug: string;
  city?: string;
  location_text?: string;
  price_display?: string;
  price_value?: number;
  budget_bracket?: BudgetBracket;
  spec_a?: string;
  spec_b?: string;
  area_sqft?: number;
  beds_options?: string[];
  tag_text?: string;
  status_text?: string;
  is_signature?: boolean;
  featured_image_media_id?: string | null;
  category_ids?: string[];
}

export interface PropertyUpdatePayload extends Partial<PropertyCreatePayload> {
  seo?: Partial<Omit<SeoMeta, "id">>;
}

export const propertyService = {
  list: (params: PropertyListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    if (params.status) query.set("status", params.status);
    if (params.city) query.set("city", params.city);
    if (params.type) query.set("type", params.type);
    if (params.budgetBracket) query.set("budget_bracket", params.budgetBracket);
    if (params.search) query.set("search", params.search);
    return apiFetchPage<PropertyListItem[]>(`/api/v1/properties?${query.toString()}`);
  },

  get: (id: string) => apiFetch<Property>(`/api/v1/properties/${id}`),

  create: (payload: PropertyCreatePayload) =>
    apiFetch<Property>("/api/v1/properties", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: PropertyUpdatePayload) =>
    apiFetch<Property>(`/api/v1/properties/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/properties/${id}`, { method: "DELETE" }),

  restore: (id: string) => apiFetch<Property>(`/api/v1/properties/${id}/restore`, { method: "POST" }),

  duplicate: (id: string) => apiFetch<Property>(`/api/v1/properties/${id}/duplicate`, { method: "POST" }),

  setGallery: (id: string, mediaIds: string[]) =>
    apiFetch<Property>(`/api/v1/properties/${id}/gallery`, {
      method: "PUT",
      body: JSON.stringify({ media_ids: mediaIds }),
    }),

  publish: (id: string) => apiFetch<Property>(`/api/v1/properties/${id}/publish`, { method: "POST" }),

  unpublish: (id: string) => apiFetch<Property>(`/api/v1/properties/${id}/unpublish`, { method: "POST" }),
};
