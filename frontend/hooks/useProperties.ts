"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import {
  propertyService,
  type PropertyCreatePayload,
  type PropertyListParams,
  type PropertyUpdatePayload,
} from "@/services/property";

const PROPERTIES_KEY = ["properties"];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

function propertyKey(id: string) {
  return [...PROPERTIES_KEY, id];
}

export function usePropertiesList(params: PropertyListParams = {}) {
  return useQuery({ queryKey: [...PROPERTIES_KEY, params], queryFn: () => propertyService.list(params) });
}

export function useProperty(id: string) {
  return useQuery({ queryKey: propertyKey(id), queryFn: () => propertyService.get(id), enabled: !!id });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PropertyCreatePayload) => propertyService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success("Property created.");
    },
    onError: onErrorToast,
  });
}

/** Standalone (not bound to one id) so the properties list page can delete
 * any row — `usePropertyActions(id).remove` is for the single-property
 * editor page, where the id is already fixed as a hook argument. */
export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propertyService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success("Property deleted.");
    },
    onError: onErrorToast,
  });
}

export function usePropertyActions(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: propertyKey(id) });
    queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
  };

  const update = useMutation({
    mutationFn: (payload: PropertyUpdatePayload) => propertyService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Saved.");
    },
    onError: onErrorToast,
  });

  const remove = useMutation({
    mutationFn: () => propertyService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Property deleted.");
    },
    onError: onErrorToast,
  });

  const duplicate = useMutation({
    mutationFn: () => propertyService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      toast.success("Property duplicated.");
    },
    onError: onErrorToast,
  });

  const setGallery = useMutation({
    mutationFn: (mediaIds: string[]) => propertyService.setGallery(id, mediaIds),
    onSuccess: () => {
      invalidate();
      toast.success("Gallery updated.");
    },
    onError: onErrorToast,
  });

  const publish = useMutation({
    mutationFn: () => propertyService.publish(id),
    onSuccess: () => {
      invalidate();
      toast.success("Published.");
    },
    onError: onErrorToast,
  });

  const unpublish = useMutation({
    mutationFn: () => propertyService.unpublish(id),
    onSuccess: () => {
      invalidate();
      toast.success("Unpublished.");
    },
    onError: onErrorToast,
  });

  return { update, remove, duplicate, setGallery, publish, unpublish };
}
