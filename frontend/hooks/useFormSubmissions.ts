"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { formSubmissionService, type FormSubmissionListParams } from "@/services/formSubmission";
import type { FormSubmissionStatus } from "@/types/formSubmission";

const SUBMISSIONS_KEY = ["form-submissions"];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function useFormSubmissionsList(params: FormSubmissionListParams = {}) {
  return useQuery({
    queryKey: [...SUBMISSIONS_KEY, params],
    queryFn: () => formSubmissionService.list(params),
  });
}

export function useUpdateFormSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: FormSubmissionStatus; assigned_to?: string | null } }) =>
      formSubmissionService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBMISSIONS_KEY });
      toast.success("Saved.");
    },
    onError: onErrorToast,
  });
}

export function useDeleteFormSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formSubmissionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBMISSIONS_KEY });
      toast.success("Submission deleted.");
    },
    onError: onErrorToast,
  });
}

export function useExportFormSubmissions() {
  return useMutation({
    mutationFn: (params: FormSubmissionListParams) => formSubmissionService.exportCsv(params),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "form-submissions.csv";
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: onErrorToast,
  });
}
