"use client";

import { useState } from "react";
import { AppDrawer } from "@/components/ui/app-drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface VersionSummary {
  id: string;
  version_number: number;
  change_note: string | null;
  created_at: string;
}

interface VersionHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  versions: VersionSummary[] | undefined;
  isLoading: boolean;
  onRestore: (versionId: string) => Promise<unknown>;
  isRestoring: boolean;
  restoreDescription?: string;
}

/** REUSABLE_COMPONENTS.md's `VersionHistoryDrawer` — generic over any entity
 * with `EntityVersion` history (Pages, Blog posts; Settings later). The
 * caller supplies its own versions query + restore mutation. */
export function VersionHistoryDrawer({
  open,
  onClose,
  versions,
  isLoading,
  onRestore,
  isRestoring,
  restoreDescription = "This overwrites the current content. This can't be undone.",
}: VersionHistoryDrawerProps) {
  const [pendingRestoreId, setPendingRestoreId] = useState<string | null>(null);

  return (
    <AppDrawer open={open} onClose={onClose} title="Version History" width="md">
      <div className="flex flex-col gap-2 py-4">
        {isLoading ? (
          <div className="text-sm text-neutral-500">Loading…</div>
        ) : (versions ?? []).length === 0 ? (
          <div className="text-sm text-neutral-500">No versions yet.</div>
        ) : (
          (versions ?? []).map((version) => (
            <div key={version.id} className="flex items-center justify-between rounded-md border px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Version {version.version_number}</div>
                <div className="text-xs text-neutral-500">
                  {version.change_note} — {new Date(version.created_at).toLocaleString()}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPendingRestoreId(version.id)}>
                Restore
              </Button>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!pendingRestoreId}
        title="Restore this version?"
        description={restoreDescription}
        variant="destructive"
        confirmLabel="Restore"
        isLoading={isRestoring}
        onCancel={() => setPendingRestoreId(null)}
        onConfirm={async () => {
          if (!pendingRestoreId) return;
          try {
            await onRestore(pendingRestoreId);
          } catch {
            // callers' restore mutations already toast their own errors
          } finally {
            setPendingRestoreId(null);
          }
        }}
      />
    </AppDrawer>
  );
}
