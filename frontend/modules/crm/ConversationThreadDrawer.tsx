"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Phone, Send, User } from "lucide-react";
import { AppDrawer } from "@/components/ui/app-drawer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/forms/SelectField";
import { useConversationThread, useSendAdminReply, useUpdateConversation } from "@/hooks/useCrm";
import { cn } from "@/lib/utils";
import type { ChatConversationStatus } from "@/types/crm";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

function shortId(id: string) {
  return id.slice(0, 8);
}

interface ConversationThreadDrawerProps {
  conversationId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ConversationThreadDrawer({ conversationId, open, onClose }: ConversationThreadDrawerProps) {
  const [reply, setReply] = useState("");
  const { data: thread } = useConversationThread(conversationId);
  const sendReply = useSendAdminReply();
  const updateConversation = useUpdateConversation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length]);

  if (!conversationId) return null;

  const handleSend = () => {
    const body = reply.trim();
    if (!body) return;
    sendReply.mutate(
      { conversationId, body },
      { onSuccess: () => setReply("") }
    );
  };

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
            className="min-h-10"
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
      <div className="flex flex-col gap-4 py-4">
        {thread ? (
          <>
            <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
              <div className="flex items-center gap-2">
                <User size={14} className="shrink-0 text-neutral-400" />
                <span className="font-medium">{thread.conversation.visitor_name ?? "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="shrink-0 text-neutral-400" />
                {thread.conversation.visitor_phone ? (
                  <a href={`tel:${thread.conversation.visitor_phone}`} className="text-emerald-700 hover:underline">
                    {thread.conversation.visitor_phone}
                  </a>
                ) : (
                  <span className="text-neutral-400">Not provided</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="shrink-0 text-neutral-400" />
                {thread.conversation.visitor_email ? (
                  <a href={`mailto:${thread.conversation.visitor_email}`} className="text-emerald-700 hover:underline">
                    {thread.conversation.visitor_email}
                  </a>
                ) : (
                  <span className="text-neutral-400">Not provided</span>
                )}
              </div>
            </div>

            <SelectField
              id="conversation_status"
              label="Status"
              value={thread.conversation.status}
              onChange={(v) =>
                updateConversation.mutate({ conversationId, payload: { status: v as ChatConversationStatus } })
              }
              options={STATUS_OPTIONS}
            />
          </>
        ) : null}

        <div ref={scrollRef} className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto pr-1">
          {(thread?.messages ?? []).map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                m.sender === "visitor"
                  ? "self-start bg-neutral-100 text-neutral-800"
                  : m.sender === "auto"
                    ? "self-end bg-amber-50 text-amber-900 border border-amber-200"
                    : "self-end bg-emerald-600 text-white"
              )}
            >
              <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                {m.sender === "visitor" ? "Visitor" : m.sender === "auto" ? "Auto-reply" : "You"}
              </div>
              <div className="whitespace-pre-wrap">{m.body}</div>
              <div className="mt-1 text-[10px] opacity-60">{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </AppDrawer>
  );
}
