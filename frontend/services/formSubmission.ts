import { apiFetch, apiFetchBlob, apiFetchPage } from "@/lib/api-client";
import type { FormSubmission, FormSubmissionStatus } from "@/types/formSubmission";

export interface FormSubmissionListParams {
  page?: number;
  perPage?: number;
  formKey?: string;
  status?: string;
}

export const formSubmissionService = {
  list: (params: FormSubmissionListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    if (params.formKey) query.set("form_key", params.formKey);
    if (params.status) query.set("status", params.status);
    return apiFetchPage<FormSubmission[]>(`/api/v1/forms/submissions?${query.toString()}`);
  },

  get: (id: string) => apiFetch<FormSubmission>(`/api/v1/forms/submissions/${id}`),

  update: (id: string, payload: { status?: FormSubmissionStatus; assigned_to?: string | null }) =>
    apiFetch<FormSubmission>(`/api/v1/forms/submissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/forms/submissions/${id}`, { method: "DELETE" }),

  exportCsv: (params: FormSubmissionListParams = {}) => {
    const query = new URLSearchParams();
    if (params.formKey) query.set("form_key", params.formKey);
    if (params.status) query.set("status", params.status);
    return apiFetchBlob(`/api/v1/forms/submissions/export?${query.toString()}`);
  },
};
