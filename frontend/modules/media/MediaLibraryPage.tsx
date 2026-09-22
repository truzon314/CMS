"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [page, setPage] = useState(1);

  const { data: folders } = useMediaFolders();
  const { data: mediaPage, isLoading } = useMediaList({ folderId, search: search || undefined, page, perPage: 40 });

  const items = mediaPage?.data ?? [];
  const meta = mediaPage?.meta;

  const handleSelectFolder = (id: string | null) => {
    setFolderId(id);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Media Library</h1>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row items-start">
        <div className="w-full shrink-0 rounded-lg border bg-white p-3 lg:w-56 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <FolderTree folders={folders ?? []} selectedFolderId={folderId} onSelect={handleSelectFolder} />
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-4">
          <MediaUploadDropzone folderId={folderId} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Input
              placeholder="Search files…"
              value={search}
              onChange={handleSearchChange}
              className="max-w-sm"
            />

            {meta && meta.total > 0 && (
              <span className="text-xs text-neutral-500 font-medium">
                Showing {((meta.page - 1) * meta.per_page) + 1}–{Math.min(meta.page * meta.per_page, meta.total)} of {meta.total} files
              </span>
            )}
          </div>

          {!isLoading && items.length === 0 ? (
            <EmptyState
              title="No files here yet"
              description="Upload something above, or pick a different folder."
            />
          ) : (
            <>
              <MediaGrid items={items} isLoading={isLoading} selectedId={selected?.id} onSelect={setSelected} />

              {meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-between border-t border-neutral-200 pt-4 mt-2">
                  <span className="text-xs text-neutral-500">
                    Page {meta.page} of {meta.total_pages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isLoading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-semibold text-neutral-700 px-2">
                      {meta.page} / {meta.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.total_pages || isLoading}
                      onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
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

