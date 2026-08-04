"use client";

import { useEffect, useState } from "react";
import { AppDrawer } from "@/components/ui/app-drawer";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { useMediaItem } from "@/hooks/useMedia";
import { useCreateGalleryItem, useDeleteGalleryItem, useUpdateGalleryItem } from "@/hooks/useGallery";
import type { GalleryItem } from "@/types/gallery";

interface GalleryItemDrawerProps {
  item: GalleryItem | null;
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM = { mediaId: null as string | null, caption: "", category: "", sortOrder: "0", isPublished: false };

export function GalleryItemDrawer({ item, open, onClose }: GalleryItemDrawerProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageUrlOverride, setImageUrlOverride] = useState<string | null>(null);
  const create = useCreateGalleryItem();
  const update = useUpdateGalleryItem();
  const remove = useDeleteGalleryItem();

  // Admin API only stores `media_id` — resolve its URL for display until the
  // user picks a new image (which gives us the URL directly), same pattern
  // as BlogPostContentEditor's featured-image resolution.
  const { data: currentMedia } = useMediaItem(imageUrlOverride === null ? item?.media_id ?? null : null);
  const imageUrl = imageUrlOverride ?? currentMedia?.url ?? null;

  useEffect(() => {
    setImageUrlOverride(null);
    setForm(
      item
        ? {
            mediaId: item.media_id,
            caption: item.caption ?? "",
            category: item.category ?? "",
            sortOrder: String(item.sort_order),
            isPublished: item.is_published,
          }
        : EMPTY_FORM
    );
  }, [item, open]);

  function handleSave() {
    if (!form.mediaId) return;
    const payload = {
      media_id: form.mediaId,
      caption: form.caption.trim() || null,
      category: form.category.trim() || null,
      sort_order: Number(form.sortOrder) || 0,
      is_published: form.isPublished,
    };
    if (item) {
      update.mutate({ id: item.id, payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  }

  function handleDelete() {
    if (!item) return;
    remove.mutate(item.id, { onSuccess: onClose });
  }

  const saving = create.isPending || update.isPending;

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={item ? "Edit Gallery Item" : "New Gallery Item"}
      width="sm"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {item ? (
            <Button variant="destructive" onClick={handleDelete} disabled={remove.isPending}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={handleSave} disabled={saving || !form.mediaId}>
            {item ? "Save" : "Create"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-4">
        <ImagePickerField
          label="Image"
          imageUrl={imageUrl}
          recommendedDimensions="1200 × 900 px"
          onChange={({ url, mediaId }) => {
            setImageUrlOverride(url || null);
            setForm((f) => ({ ...f, mediaId }));
          }}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gallery_caption">Caption</Label>
          <Input
            id="gallery_caption"
            value={form.caption}
            onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gallery_category">Category</Label>
            <Input
              id="gallery_category"
              placeholder="e.g. Amenities"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gallery_sort_order">Sort Order</Label>
            <Input
              id="gallery_sort_order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="gallery_is_published"
            checked={form.isPublished}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, isPublished: checked === true }))}
          />
          <Label htmlFor="gallery_is_published" className="font-normal">
            Published
          </Label>
        </div>
      </div>
    </AppDrawer>
  );
}
