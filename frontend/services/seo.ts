import { apiFetch } from "@/lib/api-client";

export interface SeoAuditReport {
  health_score: number;
  total_pages_scanned: number;
  total_images_scanned: number;
  missing_meta_description: Array<{ type: string; name: string; link: string }>;
  missing_seo_title: Array<{ type: string; name: string; link: string }>;
  duplicate_titles: Array<{ title: string; count: number; items: Array<{ type: string; name: string; link: string }> }>;
  missing_alt_images: Array<{ id: string; filename: string; url: string }>;
}

export interface AiGeneratePayload {
  task_type: "title" | "description" | "keywords" | "alt_text" | "faqs" | "property_description";
  topic_or_context: string;
  target_keyword?: string;
}

export interface RedirectRuleItem {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  hit_count: number;
  is_active: boolean;
  created_at: string;
}

export const seoService = {
  getAuditReport: () => apiFetch<SeoAuditReport>("/api/v1/seo/audit"),
  
  aiGenerate: (payload: AiGeneratePayload) =>
    apiFetch<Record<string, unknown>>("/api/v1/seo/ai-generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getGlobalSchema: () => apiFetch<Record<string, unknown>>("/api/v1/seo/schema/global"),

  listRedirects: () => apiFetch<RedirectRuleItem[]>("/api/v1/redirects"),

  createRedirect: (payload: { from_path: string; to_path: string; status_code?: number; is_active?: boolean }) =>
    apiFetch<RedirectRuleItem>("/api/v1/redirects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateRedirect: (id: string, payload: Partial<{ from_path: string; to_path: string; status_code: number; is_active: boolean }>) =>
    apiFetch<RedirectRuleItem>(`/api/v1/redirects/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteRedirect: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/v1/redirects/${id}`, {
      method: "DELETE",
    }),
};
