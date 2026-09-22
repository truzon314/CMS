"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, Phone, Send, User } from "lucide-react";
import { AppDrawer } from "@/components/ui/app-drawer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/forms/SelectField";
import { useConversationThread, useSendAdminReply, useUpdateConversation } from "@/hooks/useCrm";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatConversationStatus } from "@/types/crm";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

function shortId(id: string) {
  return id.slice(0, 8);
}

interface ConversationThreadDrawerProps {
  conversation: ChatConversation | null;
  open: boolean;
  onClose: () => void;
}

export function ConversationThreadDrawer({ conversation, open, onClose }: ConversationThreadDrawerProps) {
  const [reply, setReply] = useState("");
  const conversationId = conversation?.id ?? null;
  const { data: thread, isLoading } = useConversationThread(conversationId);
  const sendReply = useSendAdminReply();
  const updateConversation = useUpdateConversation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = thread?.conversation ?? conversation;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length]);

  if (!conversationId || !activeConversation) return null;

  const handleSend = () => {
    const body = reply.trim();
    if (!body) return;
    sendReply.mutate(
      { conversationId, body },
      { onSuccess: () => setReply("") }
    );
  };

  const messages = thread?.messages ?? [];

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={`Conversation #${shortId(conversationId)}`}
      width="md"
      footer={
        <div className="flex w-full items-end gap-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply…"
            className="min-h-10 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={sendReply.isPending || !reply.trim()} size="icon">
            <Send size={16} />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-4 h-full">
        {/* Visitor Info Card */}
        <div className="flex flex-col gap-2 rounded-md border p-3 text-sm bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <User size={14} className="shrink-0 text-neutral-400" />
            <span className="font-medium text-neutral-900">
              {activeConversation.visitor_name ?? "Not provided"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="shrink-0 text-neutral-400" />
            {activeConversation.visitor_phone ? (
              <a href={`tel:${activeConversation.visitor_phone}`} className="text-emerald-700 hover:underline font-medium">
                {activeConversation.visitor_phone}
              </a>
            ) : (
              <span className="text-neutral-400">Not provided</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="shrink-0 text-neutral-400" />
            {activeConversation.visitor_email ? (
              <a href={`mailto:${activeConversation.visitor_email}`} className="text-emerald-700 hover:underline">
                {activeConversation.visitor_email}
              </a>
            ) : (
              <span className="text-neutral-400">Not provided</span>
            )}
          </div>
        </div>

        {/* Status Dropdown */}
        <SelectField
          id="conversation_status"
          label="Status"
          value={activeConversation.status}
          onChange={(v) =>
            updateConversation.mutate({ conversationId, payload: { status: v as ChatConversationStatus } })
          }
          options={STATUS_OPTIONS}
        />

        {/* Thread Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Messages
          </div>

          <div ref={scrollRef} className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 min-h-[300px] max-h-[50vh]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                <span className="text-xs">Loading message history…</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-400 text-xs">
                No messages in this conversation yet.
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-xs",
                    m.sender === "visitor"
                      ? "self-start bg-neutral-100 text-neutral-800 border border-neutral-200/60"
                      : m.sender === "auto"
                        ? "self-end bg-amber-50 text-amber-900 border border-amber-200/80"
                        : "self-end bg-emerald-600 text-white"
                  )}
                >
                  <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-75">
                    {m.sender === "visitor" ? "Visitor" : m.sender === "auto" ? "Auto-reply" : "You"}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                  <div className="mt-1 text-[10px] opacity-60 text-right">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppDrawer>
  );
}

