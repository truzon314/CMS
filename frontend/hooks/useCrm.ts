"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { crmService, type ConversationListParams } from "@/services/crm";
import type { AutoReplyConfig, ChatConversationStatus } from "@/types/crm";

const CONVERSATIONS_KEY = ["crm-conversations"];
const THREAD_KEY = ["crm-conversation-thread"];
const AUTO_REPLY_KEY = ["crm-auto-reply"];

// Inbox and open-thread polling — same `refetchInterval` pattern as
// useNotifications.ts's unread-count poll, just faster since a live chat is
// more time-sensitive than the notification bell.
const INBOX_POLL_MS = 8_000;
const THREAD_POLL_MS = 4_000;

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function useConversationsList(params: ConversationListParams = {}) {
  return useQuery({
    queryKey: [...CONVERSATIONS_KEY, params],
    queryFn: () => crmService.list(params),
    refetchInterval: INBOX_POLL_MS,
  });
}

export function useConversationThread(conversationId: string | null) {
  return useQuery({
    queryKey: [...THREAD_KEY, conversationId],
    queryFn: () => crmService.getThread(conversationId as string),
    enabled: !!conversationId,
    refetchInterval: conversationId ? THREAD_POLL_MS : false,
  });
}

export function useSendAdminReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
      crmService.reply(conversationId, body),
    onSuccess: (_data, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: [...THREAD_KEY, conversationId] });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
    onError: onErrorToast,
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: { status?: ChatConversationStatus; assigned_to?: string | null };
    }) => crmService.update(conversationId, payload),
    onSuccess: (_data, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: [...THREAD_KEY, conversationId] });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      toast.success("Saved.");
    },
    onError: onErrorToast,
  });
}

export function useAutoReplyConfig() {
  return useQuery({
    queryKey: AUTO_REPLY_KEY,
    queryFn: () => crmService.getAutoReply(),
  });
}

export function useUpdateAutoReplyConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AutoReplyConfig) => crmService.updateAutoReply(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTO_REPLY_KEY });
      toast.success("Auto-reply saved.");
    },
    onError: onErrorToast,
  });
}
