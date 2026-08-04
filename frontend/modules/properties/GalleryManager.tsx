"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/ui/media-picker";
import { GalleryThumbnail } from "@/modules/properties/GalleryThumbnail";

interface GalleryManagerProps {
  mediaIds: string[];
  onChange: (mediaIds: string[]) => void;
  isSaving: boolean;
  onSave: () => void;
}

/** COMPONENT_HIERARCHY.md's `GalleryManager` — drag-reorder thumbnails,
 * "Add from Media Library" opens `MediaPicker` (single-select; click Add
 * again for more, matching MediaPicker's current single-select scope). */
export function GalleryManager({ mediaIds, onChange, isSaving, onSave }: GalleryManagerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = mediaIds.indexOf(String(active.id));
    const newIndex = mediaIds.indexOf(String(over.id));
    onChange(arrayMove(mediaIds, oldIndex, newIndex));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <Label>Gallery</Label>
        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
          Rec: 1200 × 800 px
        </span>
      </div>
      <p className="text-xs text-neutral-500 font-normal">Photos 1 to 4 appear as the interactive gallery thumbnails on property pages.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={mediaIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {mediaIds.map((mediaId) => (
              <GalleryThumbnail
                key={mediaId}
                mediaId={mediaId}
                onRemove={() => onChange(mediaIds.filter((id) => id !== mediaId))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
          <ImagePlus size={14} />
          Add from Media Library
        </Button>
        <Button type="button" size="sm" disabled={isSaving} onClick={onSave}>
          Save Gallery
        </Button>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          if (!mediaIds.includes(media.id)) onChange([...mediaIds, media.id]);
        }}
      />
    </div>
  );
}
