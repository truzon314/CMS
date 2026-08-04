"use client";

import { useState } from "react";
import { Images, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useGalleryList } from "@/hooks/useGallery";
import { GalleryItemDrawer } from "@/modules/gallery/GalleryItemDrawer";
import { useMediaItem } from "@/hooks/useMedia";
import type { GalleryItem } from "@/types/gallery";

function GalleryThumb({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const { data: media } = useMediaItem(item.media_id);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-lg border bg-neutral-100 text-left"
    >
      {media?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.url} alt={item.caption ?? ""} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 px-2 py-1 text-[11px] text-white">
        <span className="truncate">{item.caption ?? "Untitled"}</span>
        <span
          className={item.is_published ? "rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold" : "rounded-full bg-slate-500 px-1.5 py-0.5 text-[9px] font-semibold"}
        >
          {item.is_published ? "Live" : "Draft"}
        </span>
      </div>
    </button>
  );
}

export function GalleryListPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useGalleryList({ perPage: 100 });
  const items = data?.data ?? [];
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const drawerOpen = creating || !!selected;

  function closeDrawer() {
    setSelectedId(null);
    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Images size={18} />
            Gallery
          </h1>
          <p className="text-sm text-neutral-500">Photos shown on the public Gallery page.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedId(null);
            setCreating(true);
          }}
        >
          <Plus size={14} />
          New Item
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState title="No gallery items yet" description="Photos you publish here will show up on the public Gallery page." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <GalleryThumb
              key={item.id}
              item={item}
              onClick={() => {
                setCreating(false);
                setSelectedId(item.id);
              }}
            />
          ))}
        </div>
      )}

      <GalleryItemDrawer item={creating ? null : selected} open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}
