import { apiFetch } from "@/lib/api-client";
import type { Settings, SettingsUpdatePayload, SettingsVersion } from "@/types/settings";

export const settingsService = {
  get: () => apiFetch<Settings>("/api/v1/settings"),

  update: (payload: SettingsUpdatePayload) =>
    apiFetch<Settings>("/api/v1/settings", { method: "PUT", body: JSON.stringify(payload) }),

  listVersions: () => apiFetch<SettingsVersion[]>("/api/v1/settings/versions"),

  restoreVersion: (versionId: string) =>
    apiFetch<Settings>(`/api/v1/settings/versions/${versionId}/restore`, { method: "POST" }),
};
