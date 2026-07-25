"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { useMediaItem } from "@/hooks/useMedia";
import { cn } from "@/lib/utils";

interface GalleryThumbnailProps {
  mediaId: string;
  onRemove: () => void;
}

export function GalleryThumbnail({ mediaId, onRemove }: GalleryThumbnailProps) {
  const { data: media } = useMediaItem(mediaId);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mediaId });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-white p-2",
        isDragging && "opacity-50"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-neutral-400 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={15} />
      </button>
      <div className="size-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
        {media ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.alt_text ?? ""} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 truncate text-sm">{media?.file_name ?? "Loading…"}</div>
      <button
        type="button"
        onClick={onRemove}
        className="text-neutral-400 hover:text-destructive"
        aria-label="Remove from gallery"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
