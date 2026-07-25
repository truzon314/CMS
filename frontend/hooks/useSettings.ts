"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { settingsService } from "@/services/settings";
import type { SettingsUpdatePayload } from "@/types/settings";

const SETTINGS_KEY = ["settings"];

export function useSettings() {
  return useQuery({ queryKey: SETTINGS_KEY, queryFn: settingsService.get });
}

export function useSettingsVersions() {
  return useQuery({ queryKey: [...SETTINGS_KEY, "versions"], queryFn: settingsService.listVersions });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettingsUpdatePayload) => settingsService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
      toast.success("Settings saved.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Something went wrong."),
  });
}

export function useRestoreSettingsVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => settingsService.restoreVersion(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SETTINGS_KEY, "versions"] });
      toast.success("Settings version restored.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Something went wrong."),
  });
}
