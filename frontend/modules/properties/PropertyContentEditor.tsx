"use client";

import { useState } from "react";
import { SeoPanel } from "@/components/ui/seo-panel";
import { Button } from "@/components/ui/button";
import { useMediaItem } from "@/hooks/useMedia";
import { usePropertyActions } from "@/hooks/useProperties";
import type { PropertyUpdatePayload } from "@/services/property";
import { GalleryManager } from "@/modules/properties/GalleryManager";
import { PropertyDetailsForm, type PropertyDetailsDraft } from "@/modules/properties/PropertyDetailsForm";
import type { Property } from "@/types/property";
import type { SeoMeta } from "@/types/page";

interface PropertyContentEditorProps {
  property: Property;
  isSaving: boolean;
  onSave: (payload: PropertyUpdatePayload) => void;
}

export function PropertyContentEditor({ property, isSaving, onSave }: PropertyContentEditorProps) {
  const { setGallery } = usePropertyActions(property.id);
  const { data: currentFeaturedImage } = useMediaItem(property.featured_image_media_id);

  const [draft, setDraft] = useState<PropertyDetailsDraft>(() => ({
    name: property.name,
    city: property.city ?? "",
    locationText: property.location_text ?? "",
    priceDisplay: property.price_display ?? "",
    priceValue: property.price_value ?? "",
    budgetBracket: property.budget_bracket ?? "",
    specA: property.spec_a ?? "",
    specB: property.spec_b ?? "",
    areaSqft: property.area_sqft ?? "",
    bedsOptions: (property.beds_options ?? []).join(", "),
    tagText: property.tag_text ?? "",
    statusText: property.status_text ?? "",
    isSignature: property.is_signature,
    categoryIds: property.categories.map((c) => c.id),
    featuredImageUrl: "",
    featuredImageMediaId: property.featured_image_media_id,
  }));
  const [galleryMediaIds, setGalleryMediaIds] = useState(
    [...property.gallery].sort((a, b) => a.position - b.position).map((g) => g.media_id)
  );
  const [seoDraft, setSeoDraft] = useState<Partial<SeoMeta>>(() => property.seo ?? {});

  const featuredImageUrl = draft.featuredImageUrl || currentFeaturedImage?.url || "";

  function handleSave() {
    onSave({
      name: draft.name,
      city: draft.city || undefined,
      location_text: draft.locationText || undefined,
      price_display: draft.priceDisplay || undefined,
      price_value: draft.priceValue ? Number(draft.priceValue) : undefined,
      budget_bracket: draft.budgetBracket || undefined,
      spec_a: draft.specA || undefined,
      spec_b: draft.specB || undefined,
      area_sqft: draft.areaSqft ? Number(draft.areaSqft) : undefined,
      beds_options: draft.bedsOptions
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      tag_text: draft.tagText || undefined,
      status_text: draft.statusText || undefined,
      is_signature: draft.isSignature,
      featured_image_media_id: draft.featuredImageMediaId,
      category_ids: draft.categoryIds,
    });
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1">
        <PropertyDetailsForm
          draft={{ ...draft, featuredImageUrl }}
          onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        />
        <Button className="mt-3" disabled={isSaving} onClick={handleSave}>
          {isSaving ? "Saving…" : "Save Details"}
        </Button>
      </div>

      <div className="w-full shrink-0 flex flex-col gap-4 lg:w-80">
        <div className="rounded-lg border bg-white p-3">
          <GalleryManager
            mediaIds={galleryMediaIds}
            onChange={setGalleryMediaIds}
            isSaving={setGallery.isPending}
            onSave={() => setGallery.mutate(galleryMediaIds)}
          />
        </div>

        <SeoPanel
          value={seoDraft}
          onChange={(patch) => setSeoDraft((prev) => ({ ...prev, ...patch }))}
          collapsedByDefault
        />
        <Button variant="outline" size="sm" disabled={isSaving} onClick={() => onSave({ seo: seoDraft })}>
          Save SEO
        </Button>
      </div>
    </div>
  );
}
