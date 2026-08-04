"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { careerService, type CareerListParams, type CareerPayload } from "@/services/career";

const CAREERS_KEY = ["careers"];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function useCareersList(params: CareerListParams = {}) {
  return useQuery({
    queryKey: [...CAREERS_KEY, params],
    queryFn: () => careerService.list(params),
  });
}

export function useCreateCareer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CareerPayload) => careerService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAREERS_KEY });
      toast.success("Career posting created.");
    },
    onError: onErrorToast,
  });
}

export function useUpdateCareer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CareerPayload> }) => careerService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAREERS_KEY });
      toast.success("Saved.");
    },
    onError: onErrorToast,
  });
}

export function useDeleteCareer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => careerService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAREERS_KEY });
      toast.success("Career posting deleted.");
    },
    onError: onErrorToast,
  });
}
