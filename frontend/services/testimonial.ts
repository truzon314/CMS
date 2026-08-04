import { apiFetch, apiFetchPage } from "@/lib/api-client";
import type { Testimonial } from "@/types/testimonial";

export interface TestimonialListParams {
  page?: number;
  perPage?: number;
}

export interface TestimonialPayload {
  name: string;
  role_or_location?: string | null;
  quote: string;
  photo_media_id?: string | null;
  rating?: number | null;
  is_featured: boolean;
  is_published: boolean;
}

export const testimonialService = {
  list: (params: TestimonialListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    return apiFetchPage<Testimonial[]>(`/api/v1/testimonials?${query.toString()}`);
  },

  create: (payload: TestimonialPayload) =>
    apiFetch<Testimonial>("/api/v1/testimonials", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<TestimonialPayload>) =>
    apiFetch<Testimonial>(`/api/v1/testimonials/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  remove: (id: string) => apiFetch<null>(`/api/v1/testimonials/${id}`, { method: "DELETE" }),
};
