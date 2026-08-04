"use client";

import { useEffect, useState } from "react";
import { AppDrawer } from "@/components/ui/app-drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { useMediaItem } from "@/hooks/useMedia";
import { useCreateTestimonial, useDeleteTestimonial, useUpdateTestimonial } from "@/hooks/useTestimonials";
import type { Testimonial } from "@/types/testimonial";

interface TestimonialDrawerProps {
  testimonial: Testimonial | null;
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  name: "",
  roleOrLocation: "",
  quote: "",
  photoMediaId: null as string | null,
  rating: "",
  isFeatured: false,
  isPublished: false,
};

export function TestimonialDrawer({ testimonial, open, onClose }: TestimonialDrawerProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoUrlOverride, setPhotoUrlOverride] = useState<string | null>(null);
  const create = useCreateTestimonial();
  const update = useUpdateTestimonial();
  const remove = useDeleteTestimonial();

  const { data: currentPhoto } = useMediaItem(photoUrlOverride === null ? testimonial?.photo_media_id ?? null : null);
  const photoUrl = photoUrlOverride ?? currentPhoto?.url ?? null;

  useEffect(() => {
    setPhotoUrlOverride(null);
    setForm(
      testimonial
        ? {
            name: testimonial.name,
            roleOrLocation: testimonial.role_or_location ?? "",
            quote: testimonial.quote,
            photoMediaId: testimonial.photo_media_id,
            rating: testimonial.rating ? String(testimonial.rating) : "",
            isFeatured: testimonial.is_featured,
            isPublished: testimonial.is_published,
          }
        : EMPTY_FORM
    );
  }, [testimonial, open]);

  function handleSave() {
    const payload = {
      name: form.name.trim(),
      role_or_location: form.roleOrLocation.trim() || null,
      quote: form.quote.trim(),
      photo_media_id: form.photoMediaId,
      rating: form.rating ? Number(form.rating) : null,
      is_featured: form.isFeatured,
      is_published: form.isPublished,
    };
    if (testimonial) {
      update.mutate({ id: testimonial.id, payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  }

  function handleDelete() {
    if (!testimonial) return;
    remove.mutate(testimonial.id, { onSuccess: onClose });
  }

  const saving = create.isPending || update.isPending;

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={testimonial ? "Edit Testimonial" : "New Testimonial"}
      width="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {testimonial ? (
            <Button variant="destructive" onClick={handleDelete} disabled={remove.isPending}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.quote.trim()}>
            {testimonial ? "Save" : "Create"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-4">
        <ImagePickerField
          label="Photo (optional)"
          imageUrl={photoUrl}
          recommendedDimensions="200 × 200 px (square)"
          onChange={({ url, mediaId }) => {
            setPhotoUrlOverride(url || null);
            setForm((f) => ({ ...f, photoMediaId: mediaId }));
          }}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="testimonial_name">Name</Label>
            <Input id="testimonial_name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="testimonial_role">Role / Location</Label>
            <Input
              id="testimonial_role"
              placeholder="e.g. Homeowner, Elysian Woods"
              value={form.roleOrLocation}
              onChange={(e) => setForm((f) => ({ ...f, roleOrLocation: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="testimonial_quote">Quote</Label>
          <Textarea
            id="testimonial_quote"
            rows={5}
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="testimonial_rating">Rating (1–5, optional)</Label>
          <Input
            id="testimonial_rating"
            type="number"
            min={1}
            max={5}
            value={form.rating}
            onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="testimonial_is_featured"
            checked={form.isFeatured}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, isFeatured: checked === true }))}
          />
          <Label htmlFor="testimonial_is_featured" className="font-normal">
            Featured on Home page carousel
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="testimonial_is_published"
            checked={form.isPublished}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, isPublished: checked === true }))}
          />
          <Label htmlFor="testimonial_is_published" className="font-normal">
            Published
          </Label>
        </div>
      </div>
    </AppDrawer>
  );
}
