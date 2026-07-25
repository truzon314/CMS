"use client";

import { useState } from "react";
import { FolderIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { useCreateFolder, useDeleteFolder } from "@/hooks/useMedia";
import type { MediaFolder } from "@/types/media";
import { NewFolderDialog } from "@/modules/media/NewFolderDialog";

interface FolderTreeProps {
  folders: MediaFolder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
}

export function FolderTree({ folders, selectedFolderId, onSelect }: FolderTreeProps) {
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaFolder | null>(null);
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();

  const rootFolders = folders.filter((f) => f.parent_folder_id === null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-neutral-100",
          selectedFolderId === null && "bg-neutral-100 font-medium"
        )}
      >
        <FolderIcon size={14} />
        All Files
      </button>

      {rootFolders.map((folder) => (
        <div
          key={folder.id}
          className={cn(
            "group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-neutral-100",
            selectedFolderId === folder.id && "bg-neutral-100 font-medium"
          )}
        >
          <button type="button" onClick={() => onSelect(folder.id)} className="flex flex-1 items-center gap-2 text-left">
            <FolderIcon size={14} />
            <span className="truncate">{folder.name}</span>
          </button>
          <button
            type="button"
            onClick={() => setPendingDelete(folder)}
            className="text-neutral-400 opacity-0 hover:text-destructive group-hover:opacity-100"
            aria-label={`Delete ${folder.name}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      <Button variant="ghost" size="sm" className="mt-1 justify-start" onClick={() => setNewFolderOpen(true)}>
        <Plus size={14} />
        New Folder
      </Button>

      <NewFolderDialog
        key={newFolderOpen ? "open" : "closed"}
        open={newFolderOpen}
        isLoading={createFolder.isPending}
        onClose={() => setNewFolderOpen(false)}
        onConfirm={async (name) => {
          try {
            await createFolder.mutateAsync({ name });
            setNewFolderOpen(false);
          } catch {
            // already toasted by the mutation's own onError
          }
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.name}"?`}
        description="Folders with files or subfolders can't be deleted — move or remove them first."
        variant="destructive"
        confirmLabel="Delete"
        isLoading={deleteFolder.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteFolder.mutateAsync(pendingDelete.id);
            if (selectedFolderId === pendingDelete.id) onSelect(null);
          } catch {
            // already toasted by the mutation's own onError
          } finally {
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
