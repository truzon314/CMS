"use client";

import { File, FileArchive, FileSpreadsheet, FileText, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Media } from "@/types/media";

interface MediaGridProps {
  items: Media[];
  isLoading?: boolean;
  selectedId?: string | null;
  onSelect: (media: Media) => void;
}

function iconFor(mimeType: string) {
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType === "application/zip") return FileArchive;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType === "application/pdf" || mimeType.includes("word")) return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaGrid({ items, isLoading, selectedId, onSelect }: MediaGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-lg border bg-neutral-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((media) => {
        const isImage = media.mime_type.startsWith("image/");
        const Icon = iconFor(media.mime_type);
        return (
          <button
            key={media.id}
            type="button"
            onClick={() => onSelect(media)}
            className={cn(
              "flex flex-col gap-1.5 rounded-lg border bg-white p-2 text-left transition-colors hover:border-neutral-400",
              selectedId === media.id && "border-neutral-900 ring-1 ring-neutral-900"
            )}
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-neutral-50">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.url} alt={media.alt_text ?? media.file_name} className="h-full w-full object-cover" />
              ) : (
                <Icon size={28} className="text-neutral-400" />
              )}
            </div>
            <div className="truncate text-xs font-medium">{media.file_name}</div>
            <div className="text-[0.7rem] text-neutral-500">{formatSize(media.size_bytes)}</div>
          </button>
        );
      })}
    </div>
  );
}
