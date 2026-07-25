"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { seoService, type AiGeneratePayload } from "@/services/seo";
import { ApiError } from "@/lib/api-client";

export function useSeoAudit() {
  return useQuery({ queryKey: ["seo-audit"], queryFn: seoService.getAuditReport });
}

export function useGlobalSchema() {
  return useQuery({ queryKey: ["global-schema"], queryFn: seoService.getGlobalSchema });
}

export function useRedirectsList() {
  return useQuery({ queryKey: ["redirects"], queryFn: seoService.listRedirects });
}

export function useAiGenerate() {
  return useMutation({
    mutationFn: (payload: AiGeneratePayload) => seoService.aiGenerate(payload),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "AI generation failed."),
  });
}

export function useRedirectActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["redirects"] });

  const createRedirect = useMutation({
    mutationFn: (payload: { from_path: string; to_path: string; status_code?: number; is_active?: boolean }) =>
      seoService.createRedirect(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Redirect rule created.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create redirect."),
  });

  const updateRedirect = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<{ from_path: string; to_path: string; status_code: number; is_active: boolean }> }) =>
      seoService.updateRedirect(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Redirect rule updated.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update redirect."),
  });

  const deleteRedirect = useMutation({
    mutationFn: (id: string) => seoService.deleteRedirect(id),
    onSuccess: () => {
      invalidate();
      toast.success("Redirect rule deleted.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete redirect."),
  });

  return { createRedirect, updateRedirect, deleteRedirect };
}

export function usePageSpeed(url?: string) {
  return useQuery({
    queryKey: ["pagespeed", url],
    queryFn: () => seoService.getPageSpeed(url),
  });
}

export function useKeywordRankings() {
  return useQuery({
    queryKey: ["keyword-rankings"],
    queryFn: seoService.getKeywordRankings,
  });
}
