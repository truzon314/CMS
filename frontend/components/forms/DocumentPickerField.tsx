"use client";

import { useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/ui/media-picker";

interface DocumentPickerFieldProps {
  label: string;
  fileName?: string | null;
  fileUrl?: string | null;
  accept?: string[];
  hint?: string;
  onChange: (value: { url: string; mediaId: string | null; fileName: string | null }) => void;
}

/** Non-image sibling of `ImagePickerField` — same MediaPicker-backed flow,
 * but shows a filename/link row instead of an `<img>` preview (a PDF has
 * nothing to thumbnail here). */
export function DocumentPickerField({ label, fileName, fileUrl, accept, hint, onChange }: DocumentPickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-neutral-500">{hint}</p> : null}

      {fileUrl ? (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-neutral-50 px-3 py-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
          >
            <FileText size={16} className="shrink-0" />
            <span className="truncate">{fileName || "View file"}</span>
          </a>
          <button
            type="button"
            onClick={() => onChange({ url: "", mediaId: null, fileName: null })}
            className="shrink-0 rounded-full p-1 text-neutral-500 hover:text-destructive"
            aria-label="Remove file"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setPickerOpen(true)}>
        <Upload size={14} />
        {fileUrl ? "Change file" : "Choose file"}
      </Button>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        accept={accept}
        onSelect={(media) => onChange({ url: media.url, mediaId: media.id, fileName: media.file_name })}
      />
    </div>
  );
}
