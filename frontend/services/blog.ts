import { apiFetch, apiFetchPage } from "@/lib/api-client";
import type { SeoMeta } from "@/types/page";
import type { BlogPost, BlogPostListItem, BlogPostVersion } from "@/types/blog";

export interface BlogPostListParams {
  page?: number;
  perPage?: number;
  status?: string;
  category?: string;
  tag?: string;
  search?: string;
}

export interface BlogPostCreatePayload {
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  featured_image_media_id?: string | null;
  category_ids?: string[];
  tag_ids?: string[];
  reading_time_minutes?: number | null;
  is_featured?: boolean;
}

export interface BlogPostUpdatePayload extends Partial<BlogPostCreatePayload> {
  seo?: Partial<Omit<SeoMeta, "id">>;
}

export const blogService = {
  list: (params: BlogPostListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    if (params.status) query.set("status", params.status);
    if (params.category) query.set("category", params.category);
    if (params.tag) query.set("tag", params.tag);
    if (params.search) query.set("search", params.search);
    return apiFetchPage<BlogPostListItem[]>(`/api/v1/blog/posts?${query.toString()}`);
  },

  get: (id: string) => apiFetch<BlogPost>(`/api/v1/blog/posts/${id}`),

  create: (payload: BlogPostCreatePayload) =>
    apiFetch<BlogPost>("/api/v1/blog/posts", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: BlogPostUpdatePayload) =>
    apiFetch<BlogPost>(`/api/v1/blog/posts/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/blog/posts/${id}`, { method: "DELETE" }),

  restore: (id: string) => apiFetch<BlogPost>(`/api/v1/blog/posts/${id}/restore`, { method: "POST" }),

  duplicate: (id: string) => apiFetch<BlogPost>(`/api/v1/blog/posts/${id}/duplicate`, { method: "POST" }),

  publish: (id: string) => apiFetch<BlogPost>(`/api/v1/blog/posts/${id}/publish`, { method: "POST" }),

  unpublish: (id: string) => apiFetch<BlogPost>(`/api/v1/blog/posts/${id}/unpublish`, { method: "POST" }),

  schedule: (id: string, scheduledAt: string) =>
    apiFetch<BlogPost>(`/api/v1/blog/posts/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    }),

  listVersions: (id: string) => apiFetch<BlogPostVersion[]>(`/api/v1/blog/posts/${id}/versions`),

  restoreVersion: (id: string, versionId: string) =>
    apiFetch<BlogPost>(`/api/v1/blog/posts/${id}/versions/${versionId}/restore`, { method: "POST" }),
};
