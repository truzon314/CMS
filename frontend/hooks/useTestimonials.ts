"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { testimonialService, type TestimonialListParams, type TestimonialPayload } from "@/services/testimonial";

const TESTIMONIALS_KEY = ["testimonials"];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function useTestimonialsList(params: TestimonialListParams = {}) {
  return useQuery({
    queryKey: [...TESTIMONIALS_KEY, params],
    queryFn: () => testimonialService.list(params),
  });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TestimonialPayload) => testimonialService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TESTIMONIALS_KEY });
      toast.success("Testimonial created.");
    },
    onError: onErrorToast,
  });
}

export function useUpdateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TestimonialPayload> }) =>
      testimonialService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TESTIMONIALS_KEY });
      toast.success("Saved.");
    },
    onError: onErrorToast,
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testimonialService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TESTIMONIALS_KEY });
      toast.success("Testimonial deleted.");
    },
    onError: onErrorToast,
  });
}
