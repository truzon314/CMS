import { apiFetch, apiFetchPage } from "@/lib/api-client";
import type { Notification } from "@/types/notification";

export const notificationService = {
  list: (params: { page?: number; perPage?: number; unreadOnly?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    if (params.unreadOnly) query.set("unread_only", "true");
    return apiFetchPage<Notification[]>(`/api/v1/notifications?${query.toString()}`);
  },

  unreadCount: () => apiFetch<{ count: number }>("/api/v1/notifications/unread-count"),

  markRead: (id: string) => apiFetch<Notification>(`/api/v1/notifications/${id}/read`, { method: "POST" }),

  markAllRead: () => apiFetch<{ marked_all_read: boolean }>("/api/v1/notifications/read-all", { method: "POST" }),
};
