import { apiFetch, apiFetchPage } from "@/lib/api-client";
import type { Career } from "@/types/career";

export interface CareerListParams {
  page?: number;
  perPage?: number;
}

export interface CareerPayload {
  title: string;
  department?: string | null;
  location?: string | null;
  employment_type?: string | null;
  description: string;
  apply_email?: string | null;
  is_published: boolean;
}

export const careerService = {
  list: (params: CareerListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    return apiFetchPage<Career[]>(`/api/v1/careers?${query.toString()}`);
  },

  create: (payload: CareerPayload) =>
    apiFetch<Career>("/api/v1/careers", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<CareerPayload>) =>
    apiFetch<Career>(`/api/v1/careers/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id: string) => apiFetch<null>(`/api/v1/careers/${id}`, { method: "DELETE" }),
};
