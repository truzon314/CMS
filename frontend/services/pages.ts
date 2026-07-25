import { apiFetch } from "@/lib/api-client";
import type { BlockDefinition, EntityVersion, Page, PageListItem, PageType, SeoMeta } from "@/types/page";

export interface PageUpdatePayload {
  title?: string;
  seo?: Partial<Omit<SeoMeta, "id">>;
}

export const pagesService = {
  list: () => apiFetch<PageListItem[]>("/api/v1/pages"),

  get: (pageType: PageType) => apiFetch<Page>(`/api/v1/pages/${pageType}`),

  preview: (pageType: PageType) => apiFetch<Page>(`/api/v1/pages/${pageType}/preview`),

  update: (pageType: PageType, payload: PageUpdatePayload) =>
    apiFetch<Page>(`/api/v1/pages/${pageType}`, { method: "PUT", body: JSON.stringify(payload) }),

  publish: (pageType: PageType) => apiFetch<Page>(`/api/v1/pages/${pageType}/publish`, { method: "POST" }),

  unpublish: (pageType: PageType) => apiFetch<Page>(`/api/v1/pages/${pageType}/unpublish`, { method: "POST" }),

  schedule: (pageType: PageType, scheduledAt: string) =>
    apiFetch<Page>(`/api/v1/pages/${pageType}/schedule`, {
      method: "POST",
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    }),

  addBlock: (pageType: PageType, payload: { block_definition_id: string; config: Record<string, unknown> }) =>
    apiFetch<Page>(`/api/v1/pages/${pageType}/blocks`, { method: "POST", body: JSON.stringify(payload) }),

  updateBlock: (pageType: PageType, blockId: string, config: Record<string, unknown>) =>
    apiFetch<Page>(`/api/v1/pages/${pageType}/blocks/${blockId}`, {
      method: "PUT",
      body: JSON.stringify({ config }),
    }),

  deleteBlock: (pageType: PageType, blockId: string) =>
    apiFetch<Page>(`/api/v1/pages/${pageType}/blocks/${blockId}`, { method: "DELETE" }),

  reorderBlocks: (pageType: PageType, order: string[]) =>
    apiFetch<Page>(`/api/v1/pages/${pageType}/blocks/reorder`, {
      method: "PUT",
      body: JSON.stringify({ order }),
    }),

  listVersions: (pageType: PageType) => apiFetch<EntityVersion[]>(`/api/v1/pages/${pageType}/versions`),

  restoreVersion: (pageType: PageType, versionId: string) =>
    apiFetch<Page>(`/api/v1/pages/${pageType}/versions/${versionId}/restore`, { method: "POST" }),

  listBlockDefinitions: () => apiFetch<BlockDefinition[]>("/api/v1/block-definitions"),
};
