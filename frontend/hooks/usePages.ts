"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pagesService, type PageUpdatePayload } from "@/services/pages";
import { ApiError } from "@/lib/api-client";
import type { PageType } from "@/types/page";

function pageKey(pageType: PageType) {
  return ["pages", pageType];
}

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function usePagesList() {
  return useQuery({ queryKey: ["pages"], queryFn: pagesService.list });
}

export function usePage(pageType: PageType) {
  return useQuery({ queryKey: pageKey(pageType), queryFn: () => pagesService.get(pageType) });
}

export function useBlockDefinitions() {
  return useQuery({ queryKey: ["block-definitions"], queryFn: pagesService.listBlockDefinitions });
}

export function usePagePreview(pageType: PageType, enabled: boolean) {
  return useQuery({
    queryKey: [...pageKey(pageType), "preview"],
    queryFn: () => pagesService.preview(pageType),
    enabled,
  });
}

export function usePageVersions(pageType: PageType) {
  return useQuery({
    queryKey: [...pageKey(pageType), "versions"],
    queryFn: () => pagesService.listVersions(pageType),
  });
}

export function usePageActions(pageType: PageType) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: pageKey(pageType) });
    queryClient.invalidateQueries({ queryKey: ["pages"] });
  };

  const updatePage = useMutation({
    mutationFn: (payload: PageUpdatePayload) => pagesService.update(pageType, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Saved.");
    },
    onError: onErrorToast,
  });

  const publish = useMutation({
    mutationFn: () => pagesService.publish(pageType),
    onSuccess: () => {
      invalidate();
      toast.success("Published.");
    },
    onError: onErrorToast,
  });

  const unpublish = useMutation({
    mutationFn: () => pagesService.unpublish(pageType),
    onSuccess: () => {
      invalidate();
      toast.success("Unpublished.");
    },
    onError: onErrorToast,
  });

  const schedule = useMutation({
    mutationFn: (scheduledAt: string) => pagesService.schedule(pageType, scheduledAt),
    onSuccess: () => {
      invalidate();
      toast.success("Scheduled.");
    },
    onError: onErrorToast,
  });

  const addBlock = useMutation({
    mutationFn: (payload: { block_definition_id: string; config: Record<string, unknown> }) =>
      pagesService.addBlock(pageType, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Block added.");
    },
    onError: onErrorToast,
  });

  const updateBlock = useMutation({
    mutationFn: ({ blockId, config }: { blockId: string; config: Record<string, unknown> }) =>
      pagesService.updateBlock(pageType, blockId, config),
    onSuccess: () => {
      invalidate();
      toast.success("Block saved.");
    },
    onError: onErrorToast,
  });

  const deleteBlock = useMutation({
    mutationFn: (blockId: string) => pagesService.deleteBlock(pageType, blockId),
    onSuccess: () => {
      invalidate();
      toast.success("Block removed.");
    },
    onError: onErrorToast,
  });

  const reorderBlocks = useMutation({
    mutationFn: (order: string[]) => pagesService.reorderBlocks(pageType, order),
    onSuccess: () => invalidate(),
    onError: onErrorToast,
  });

  const restoreVersion = useMutation({
    mutationFn: (versionId: string) => pagesService.restoreVersion(pageType, versionId),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: [...pageKey(pageType), "versions"] });
      toast.success("Version restored.");
    },
    onError: onErrorToast,
  });

  return { updatePage, publish, unpublish, schedule, addBlock, updateBlock, deleteBlock, reorderBlocks, restoreVersion };
}
