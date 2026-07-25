import { apiFetch } from "@/lib/api-client";
import type { SearchResult } from "@/types/search";

export const searchService = {
  search: (q: string) => apiFetch<SearchResult[]>(`/api/v1/search?q=${encodeURIComponent(q)}`),
};
