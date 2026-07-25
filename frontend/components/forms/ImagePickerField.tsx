"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/ui/media-picker";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

interface ImagePickerFieldProps {
  label: string;
  mediaId?: string | null;
  imageUrl?: string | null;
  onChange: (value: { url: string; mediaId: string | null }) => void;
}

export function ImagePickerField({ label, imageUrl, onChange }: ImagePickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>

      {imageUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="max-h-40 w-full rounded-md border object-cover" />
          <button
            type="button"
            onClick={() => onChange({ url: "", mediaId: null })}
            className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1 text-neutral-600 hover:text-destructive"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setPickerOpen(true)}>
        <ImagePlus size={14} />
        {imageUrl ? "Change image" : "Choose image"}
      </Button>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        accept={IMAGE_MIME_TYPES}
        onSelect={(media) => onChange({ url: media.url, mediaId: media.id })}
      />
    </div>
  );
}
