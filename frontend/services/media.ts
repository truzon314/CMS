import { apiFetch, apiFetchPage } from "@/lib/api-client";
import type { Media, MediaFolder, MediaUsage } from "@/types/media";

export interface MediaListParams {
  page?: number;
  perPage?: number;
  folderId?: string | null;
  mimeType?: string;
  search?: string;
}

export const mediaService = {
  list: (params: MediaListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    if (params.folderId) query.set("folder_id", params.folderId);
    if (params.mimeType) query.set("mime_type", params.mimeType);
    if (params.search) query.set("search", params.search);
    return apiFetchPage<Media[]>(`/api/v1/media?${query.toString()}`);
  },

  get: (id: string) => apiFetch<Media>(`/api/v1/media/${id}`),

  upload: (files: File[], folderId?: string | null) => {
    const form = new FormData();
    for (const file of files) form.append("files", file);
    const query = folderId ? `?folder_id=${folderId}` : "";
    return apiFetch<Media[]>(`/api/v1/media${query}`, { method: "POST", body: form });
  },

  update: (id: string, payload: { file_name?: string; alt_text?: string; folder_id?: string | null }) =>
    apiFetch<Media>(`/api/v1/media/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id: string, force = false) =>
    apiFetch<{ deleted: boolean }>(`/api/v1/media/${id}${force ? "?force=true" : ""}`, { method: "DELETE" }),

  usage: (id: string) => apiFetch<MediaUsage[]>(`/api/v1/media/${id}/usage`),

  listFolders: () => apiFetch<MediaFolder[]>("/api/v1/media/folders"),

  createFolder: (payload: { name: string; parent_folder_id?: string | null }) =>
    apiFetch<MediaFolder>("/api/v1/media/folders", { method: "POST", body: JSON.stringify(payload) }),

  updateFolder: (id: string, payload: { name?: string; parent_folder_id?: string | null }) =>
    apiFetch<MediaFolder>(`/api/v1/media/folders/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  removeFolder: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/v1/media/folders/${id}`, { method: "DELETE" }),
};
