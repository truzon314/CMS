"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useMediaFolders, useMediaList } from "@/hooks/useMedia";
import { FolderTree } from "@/modules/media/FolderTree";
import { MediaDetailsDrawer } from "@/modules/media/MediaDetailsDrawer";
import { MediaGrid } from "@/modules/media/MediaGrid";
import { MediaUploadDropzone } from "@/modules/media/MediaUploadDropzone";
import type { Media } from "@/types/media";

export function MediaLibraryPage() {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Media | null>(null);

  const { data: folders } = useMediaFolders();
  const { data: mediaPage, isLoading } = useMediaList({ folderId, search: search || undefined, perPage: 60 });

  const items = mediaPage?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Media Library</h1>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full shrink-0 rounded-lg border bg-white p-3 lg:w-56">
          <FolderTree folders={folders ?? []} selectedFolderId={folderId} onSelect={setFolderId} />
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-4">
          <MediaUploadDropzone folderId={folderId} />

          <Input
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {!isLoading && items.length === 0 ? (
            <EmptyState
              title="No files here yet"
              description="Upload something above, or pick a different folder."
            />
          ) : (
            <MediaGrid items={items} isLoading={isLoading} selectedId={selected?.id} onSelect={setSelected} />
          )}
        </div>
      </div>

      <MediaDetailsDrawer
        key={selected?.id ?? "none"}
        media={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
