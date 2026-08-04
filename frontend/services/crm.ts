import { apiFetch, apiFetchPage } from "@/lib/api-client";
import type { AutoReplyConfig, ChatConversation, ChatConversationStatus, ChatConversationThread, ChatMessage } from "@/types/crm";

export interface ConversationListParams {
  page?: number;
  perPage?: number;
}

export const crmService = {
  list: (params: ConversationListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.perPage) query.set("per_page", String(params.perPage));
    return apiFetchPage<ChatConversation[]>(`/api/v1/crm/conversations?${query.toString()}`);
  },

  getThread: (conversationId: string) =>
    apiFetch<ChatConversationThread>(`/api/v1/crm/conversations/${conversationId}/messages`),

  reply: (conversationId: string, body: string) =>
    apiFetch<ChatMessage>(`/api/v1/crm/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  update: (conversationId: string, payload: { status?: ChatConversationStatus; assigned_to?: string | null }) =>
    apiFetch<ChatConversation>(`/api/v1/crm/conversations/${conversationId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getAutoReply: () => apiFetch<AutoReplyConfig>("/api/v1/crm/auto-reply"),

  updateAutoReply: (payload: AutoReplyConfig) =>
    apiFetch<AutoReplyConfig>("/api/v1/crm/auto-reply", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
