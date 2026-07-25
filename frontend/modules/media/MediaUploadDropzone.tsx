"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadMedia } from "@/hooks/useMedia";
import type { Media } from "@/types/media";

interface MediaUploadDropzoneProps {
  folderId: string | null;
  onUploaded?: (media: Media[]) => void;
}

export function MediaUploadDropzone({ folderId, onUploaded }: MediaUploadDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadMedia();

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    upload.mutate(
      { files: Array.from(fileList), folderId },
      { onSuccess: onUploaded }
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        dragOver ? "border-neutral-900 bg-neutral-50" : "border-neutral-300 hover:border-neutral-400"
      )}
    >
      <UploadCloud size={22} className="text-neutral-400" />
      <p className="text-sm font-medium">
        {upload.isPending ? "Uploading…" : "Drag files here, or click to browse"}
      </p>
      <p className="text-xs text-neutral-500">Images, video, PDF, Word, Excel, SVG, ZIP</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
