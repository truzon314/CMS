"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { useConversationsList } from "@/hooks/useCrm";
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
  const conversations = data?.data ?? [];

  const columns: ColumnDef<ChatConversation>[] = [
    {
      id: "visitor",
      header: "Conversation",
      cell: (c) => (
        <span className="flex items-center gap-2 font-medium">
          {c.has_unread && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
          {c.visitor_name ?? `Conversation #${shortId(c.id)}`}
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
              ? "inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-0.5 text-xs font-semibold text-[#137333] border border-[#ceead6]"
              : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200"
          }
        >
          {c.status === "open" ? "Open" : "Closed"}
        </span>
      ),
    },
    { id: "assigned", header: "Assigned to", cell: (c) => c.assigned_to ?? "—" },
    {
      id: "last_message_at",
      header: "Last message",
      cell: (c) => new Date(c.last_message_at).toLocaleString(),
    },
  ];

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <MessageCircle size={18} />
            CRM
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
        conversationId={selected?.id ?? null}
        open={!!selected}
        onClose={() => setSelectedId(null)}
      />
      <AutoReplyPanel open={showAutoReply} onClose={() => setShowAutoReply(false)} />
    </div>
  );
}
