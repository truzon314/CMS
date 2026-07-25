"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMediaFolders, useMediaList, useUploadMedia } from "@/hooks/useMedia";
import { FolderTree } from "@/modules/media/FolderTree";
import { MediaGrid } from "@/modules/media/MediaGrid";
import { MediaUploadDropzone } from "@/modules/media/MediaUploadDropzone";
import type { Media } from "@/types/media";

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  accept?: string[];
  onSelect: (media: Media) => void;
}

/** REUSABLE_COMPONENTS.md's `MediaPicker` — Library tab (folder filter + search +
 * grid) and Upload tab (dropzone, switches to Library and preselects on completion).
 * Single-select only for now (block editors need one image at a time). */
export function MediaPicker({ open, onClose, accept, onSelect }: MediaPickerProps) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: folders } = useMediaFolders();
  const { data: mediaPage, isLoading } = useMediaList({ folderId, search: search || undefined, perPage: 60 });
  const upload = useUploadMedia();

  const items = (mediaPage?.data ?? []).filter((m) => !accept || accept.includes(m.mime_type));

  function pick(media: Media) {
    onSelect(media);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select media</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b pb-2">
          {(["library", "upload"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize",
                tab === t ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          <MediaUploadDropzone
            folderId={folderId}
            onUploaded={(uploaded) => {
              setTab("library");
              if (uploaded[0]) pick(uploaded[0]);
            }}
          />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-full shrink-0 sm:w-48">
              <FolderTree folders={folders ?? []} selectedFolderId={folderId} onSelect={setFolderId} />
            </div>
            <div className="min-w-0 flex-1 flex flex-col gap-3">
              <Input placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} />
              {!isLoading && items.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  {upload.isPending ? "Uploading…" : "No matching files. Try the Upload tab."}
                </p>
              ) : (
                <MediaGrid items={items} isLoading={isLoading} onSelect={pick} />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
