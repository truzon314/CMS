"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { useAuditLogsList } from "@/hooks/useAuditLogs";
import { auditLogService } from "@/services/auditLog";
import type { AuditLogEntry } from "@/types/auditLog";

export function AuditLogsPage() {
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useAuditLogsList({
    action: action || undefined,
    entityType: entityType || undefined,
    perPage: 50,
  });

  const logs = data?.data ?? [];

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await auditLogService.exportCsv({
        action: action || undefined,
        entityType: entityType || undefined,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "audit-log.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const columns: ColumnDef<AuditLogEntry>[] = [
    { id: "created_at", header: "When", cell: (l) => new Date(l.created_at).toLocaleString() },
    { id: "user", header: "User", cell: (l) => l.user_name ?? "System" },
    { id: "action", header: "Action", cell: (l) => l.action },
    { id: "entity_type", header: "Entity", cell: (l) => l.entity_type ?? "—" },
    { id: "ip_address", header: "IP Address", cell: (l) => l.ip_address ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Audit Logs</h1>
        <Button variant="outline" disabled={exporting} onClick={handleExport}>
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-56 flex-col gap-1.5">
          <Label htmlFor="action_filter">Action contains</Label>
          <Input id="action_filter" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. publish" />
        </div>
        <div className="flex w-56 flex-col gap-1.5">
          <Label htmlFor="entity_filter">Entity type</Label>
          <Input
            id="entity_filter"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            placeholder="e.g. blog_post"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        getRowId={(l) => l.id}
        emptyTitle="No activity yet"
        emptyDescription="Every mutating action across the CMS (pages, blog, properties, media, users, settings) shows up here."
      />
    </div>
  );
}
