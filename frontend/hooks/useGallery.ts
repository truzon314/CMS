"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { galleryService, type GalleryItemPayload, type GalleryListParams } from "@/services/gallery";

const GALLERY_KEY = ["gallery"];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function useGalleryList(params: GalleryListParams = {}) {
  return useQuery({
    queryKey: [...GALLERY_KEY, params],
    queryFn: () => galleryService.list(params),
  });
}

export function useCreateGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GalleryItemPayload) => galleryService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GALLERY_KEY });
      toast.success("Gallery item created.");
    },
    onError: onErrorToast,
  });
}

export function useUpdateGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GalleryItemPayload> }) =>
      galleryService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GALLERY_KEY });
      toast.success("Saved.");
    },
    onError: onErrorToast,
  });
}

export function useDeleteGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => galleryService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GALLERY_KEY });
      toast.success("Gallery item deleted.");
    },
    onError: onErrorToast,
  });
}
