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

export interface AutocompleteResult {
  query: string;
  suggestions: string[];
}

export type NotConfigured = { configured: false };

export interface PageSpeedScores {
  performance: number | null;
  accessibility: number | null;
  best_practices: number | null;
  seo: number | null;
}

export interface PageSpeedMetric {
  value: string | null;
  score: number | null;
}

export interface PageSpeedResult {
  configured: true;
  url: string;
  scores: PageSpeedScores;
  metrics: Record<string, PageSpeedMetric | null>;
  diagnostics: Array<{ id: string; title: string; score: number }>;
}

export interface RankingRow {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr_percent: number;
  avg_position: number;
}

export interface RankingsResult {
  configured: true;
  date_range: { start: string; end: string };
  rows: RankingRow[];
}

export interface BacklinksResult {
  configured: true;
  target: string;
  metrics: Record<string, unknown>;
  backlinks: Record<string, unknown>;
}

export interface SeoExportReport extends SeoAuditReport {
  generated_at: string;
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

  exportReport: () => apiFetch<SeoExportReport>("/api/v1/seo/export"),

  getAutocomplete: (q: string) =>
    apiFetch<AutocompleteResult>(`/api/v1/seo/autocomplete?q=${encodeURIComponent(q)}`),

  getPageSpeed: (url: string) =>
    apiFetch<PageSpeedResult | NotConfigured>(`/api/v1/seo/pagespeed?url=${encodeURIComponent(url)}`),

  getRankings: () => apiFetch<RankingsResult | NotConfigured>("/api/v1/seo/rankings"),

  getBacklinks: (target: string) =>
    apiFetch<BacklinksResult | NotConfigured>(`/api/v1/seo/backlinks?target=${encodeURIComponent(target)}`),
};
