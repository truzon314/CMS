"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { blogService, type BlogPostCreatePayload, type BlogPostListParams, type BlogPostUpdatePayload } from "@/services/blog";

const POSTS_KEY = ["blog-posts"];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

function postKey(id: string) {
  return [...POSTS_KEY, id];
}

export function useBlogPostsList(params: BlogPostListParams = {}) {
  return useQuery({ queryKey: [...POSTS_KEY, params], queryFn: () => blogService.list(params) });
}

export function useBlogPost(id: string) {
  return useQuery({ queryKey: postKey(id), queryFn: () => blogService.get(id), enabled: !!id });
}

export function useBlogPostVersions(id: string) {
  return useQuery({ queryKey: [...postKey(id), "versions"], queryFn: () => blogService.listVersions(id) });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BlogPostCreatePayload) => blogService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
      toast.success("Post created.");
    },
    onError: onErrorToast,
  });
}

export function useBlogPostActions(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: postKey(id) });
    queryClient.invalidateQueries({ queryKey: POSTS_KEY });
  };

  const update = useMutation({
    mutationFn: (payload: BlogPostUpdatePayload) => blogService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Saved.");
    },
    onError: onErrorToast,
  });

  const remove = useMutation({
    mutationFn: () => blogService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Post deleted.");
    },
    onError: onErrorToast,
  });

  const duplicate = useMutation({
    mutationFn: () => blogService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
      toast.success("Post duplicated.");
    },
    onError: onErrorToast,
  });

  const publish = useMutation({
    mutationFn: () => blogService.publish(id),
    onSuccess: () => {
      invalidate();
      toast.success("Published.");
    },
    onError: onErrorToast,
  });

  const unpublish = useMutation({
    mutationFn: () => blogService.unpublish(id),
    onSuccess: () => {
      invalidate();
      toast.success("Unpublished.");
    },
    onError: onErrorToast,
  });

  const schedule = useMutation({
    mutationFn: (scheduledAt: string) => blogService.schedule(id, scheduledAt),
    onSuccess: () => {
      invalidate();
      toast.success("Scheduled.");
    },
    onError: onErrorToast,
  });

  const restoreVersion = useMutation({
    mutationFn: (versionId: string) => blogService.restoreVersion(id, versionId),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: [...postKey(id), "versions"] });
      toast.success("Version restored.");
    },
    onError: onErrorToast,
  });

  return { update, remove, duplicate, publish, unpublish, schedule, restoreVersion };
}
