"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { mediaService, type MediaListParams } from "@/services/media";

const MEDIA_KEY = ["media"];
const FOLDERS_KEY = ["media-folders"];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function useMediaList(params: MediaListParams = {}) {
  return useQuery({
    queryKey: [...MEDIA_KEY, params],
    queryFn: () => mediaService.list(params),
  });
}

export function useMediaItem(mediaId: string | null) {
  return useQuery({
    queryKey: [...MEDIA_KEY, mediaId],
    queryFn: () => mediaService.get(mediaId as string),
    enabled: !!mediaId,
  });
}

export function useMediaUsage(mediaId: string | null) {
  return useQuery({
    queryKey: [...MEDIA_KEY, mediaId, "usage"],
    queryFn: () => mediaService.usage(mediaId as string),
    enabled: !!mediaId,
  });
}

export function useMediaFolders() {
  return useQuery({ queryKey: FOLDERS_KEY, queryFn: mediaService.listFolders });
}

function useInvalidateMedia() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
}

export function useUploadMedia() {
  const invalidate = useInvalidateMedia();
  return useMutation({
    mutationFn: ({ files, folderId }: { files: File[]; folderId?: string | null }) =>
      mediaService.upload(files, folderId),
    onSuccess: (uploaded) => {
      invalidate();
      toast.success(uploaded.length === 1 ? "File uploaded." : `${uploaded.length} files uploaded.`);
    },
    onError: onErrorToast,
  });
}

export function useUpdateMedia() {
  const invalidate = useInvalidateMedia();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { file_name?: string; alt_text?: string; folder_id?: string | null } }) =>
      mediaService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Saved.");
    },
    onError: onErrorToast,
  });
}

export function useDeleteMedia() {
  const invalidate = useInvalidateMedia();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => mediaService.remove(id, force),
    onSuccess: () => {
      invalidate();
      toast.success("Deleted.");
    },
  });
}

function useInvalidateFolders() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
}

export function useCreateFolder() {
  const invalidate = useInvalidateFolders();
  return useMutation({
    mutationFn: (payload: { name: string; parent_folder_id?: string | null }) => mediaService.createFolder(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Folder created.");
    },
    onError: onErrorToast,
  });
}

export function useUpdateFolder() {
  const invalidate = useInvalidateFolders();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; parent_folder_id?: string | null } }) =>
      mediaService.updateFolder(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Folder renamed.");
    },
    onError: onErrorToast,
  });
}

export function useDeleteFolder() {
  const invalidate = useInvalidateFolders();
  return useMutation({
    mutationFn: (id: string) => mediaService.removeFolder(id),
    onSuccess: () => {
      invalidate();
      toast.success("Folder deleted.");
    },
    onError: onErrorToast,
  });
}
