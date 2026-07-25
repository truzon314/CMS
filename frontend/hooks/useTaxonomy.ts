"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { categoriesService, tagsService } from "@/services/taxonomy";
import type { CategoryAppliesTo } from "@/types/taxonomy";

const CATEGORIES_KEY = ["categories"];
const TAGS_KEY = ["tags"];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function useCategories(appliesTo?: CategoryAppliesTo) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, appliesTo],
    queryFn: () => categoriesService.list(appliesTo),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      toast.success("Category created.");
    },
    onError: onErrorToast,
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; slug?: string; applies_to?: CategoryAppliesTo } }) =>
      categoriesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      toast.success("Category updated.");
    },
    onError: onErrorToast,
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      toast.success("Category deleted.");
    },
    onError: onErrorToast,
  });
}

export function useTags() {
  return useQuery({ queryKey: TAGS_KEY, queryFn: tagsService.list });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tagsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
      toast.success("Tag created.");
    },
    onError: onErrorToast,
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; slug?: string } }) => tagsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
      toast.success("Tag updated.");
    },
    onError: onErrorToast,
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
      toast.success("Tag deleted.");
    },
    onError: onErrorToast,
  });
}
