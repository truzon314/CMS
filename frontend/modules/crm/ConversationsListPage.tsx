"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { useConversationsList, useDeleteConversation } from "@/hooks/useCrm";
import { ConversationThreadDrawer } from "@/modules/crm/ConversationThreadDrawer";
import { AutoReplyPanel } from "@/modules/crm/AutoReplyPanel";
import type { ChatConversation } from "@/types/crm";

function shortId(id: string) {
  return id.slice(0, 8);
}

export function ConversationsListPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAutoReply, setShowAutoReply] = useState(false);

  const { data, isLoading } = useConversationsList();
  const deleteConversation = useDeleteConversation();
  const conversations = data?.data ?? [];

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation and all its messages? This cannot be undone.")) return;
    deleteConversation.mutate(id);
    if (selectedId === id) setSelectedId(null);
  };

  const columns: ColumnDef<ChatConversation>[] = [
    {
      id: "visitor_name",
      header: "Name",
      cell: (c) => (
        <span className="flex items-center gap-2 font-medium text-neutral-900">
          {c.has_unread && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" title="New message" />}
          <User size={14} className="text-neutral-400 shrink-0" />
          {c.visitor_name ?? `Visitor #${shortId(c.id)}`}
        </span>
      ),
    },
    {
      id: "visitor_phone",
      header: "Phone Number",
      cell: (c) =>
        c.visitor_phone ? (
          <a
            href={`tel:${c.visitor_phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline font-medium"
          >
            <Phone size={13} className="shrink-0 text-emerald-600" />
            {c.visitor_phone}
          </a>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        ),
    },
    {
      id: "visitor_email",
      header: "Email",
      cell: (c) =>
        c.visitor_email ? (
          <a
            href={`mailto:${c.visitor_email}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline truncate max-w-[180px]"
          >
            <Mail size={13} className="shrink-0 text-emerald-600" />
            {c.visitor_email}
          </a>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        ),
    },
    {
      id: "last_message",
      header: "Latest Chat / Message",
      cell: (c) => (
        <span className="text-xs text-neutral-700 truncate max-w-[260px] block" title={c.last_message_preview ?? ""}>
          {c.last_message_preview ?? "No messages yet"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (c) => (
        <span
          className={
            c.status === "open"
              ? "inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-xs font-semibold text-[#137333] border border-[#ceead6]"
              : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200"
          }
        >
          {c.status === "open" ? "Open" : "Closed"}
        </span>
      ),
    },
    {
      id: "last_message_at",
      header: "Last Active",
      cell: (c) => (
        <span className="text-xs text-neutral-500 whitespace-nowrap">
          {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (c) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-neutral-400 hover:text-red-600"
          onClick={(e) => handleDelete(e, c.id)}
          disabled={deleteConversation.isPending}
          title="Delete conversation"
        >
          <Trash2 size={15} />
        </Button>
      ),
      className: "w-10",
    },
  ];

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <MessageCircle size={18} />
            Live Chat
          </h1>
          <p className="text-sm text-neutral-500">Live-chat conversations from the public site.</p>
        </div>
        <Button variant="outline" onClick={() => setShowAutoReply(true)}>
          Auto-Reply Settings
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={conversations}
        isLoading={isLoading}
        getRowId={(c) => c.id}
        onRowClick={(c) => setSelectedId(c.id)}
        emptyTitle="No conversations yet"
        emptyDescription="Messages from the public site's live-chat widget will show up here."
      />

      <ConversationThreadDrawer
        conversation={selected}
        open={!!selected}
        onClose={() => setSelectedId(null)}
      />
      <AutoReplyPanel open={showAutoReply} onClose={() => setShowAutoReply(false)} />
    </div>
  );
}
