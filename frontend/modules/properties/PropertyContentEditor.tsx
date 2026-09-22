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
    description: property.description ?? "",
    amenities: property.amenities ?? [],
    tagText: property.tag_text ?? "",
    statusText: property.status_text ?? "",
    isSignature: property.is_signature,
    categoryIds: property.categories.map((c) => c.id),
    featuredImageUrl: "",
    featuredImageMediaId: property.featured_image_media_id,
    brochureMediaId: property.brochure_media_id,
    mapProjectId: property.map_project_id,

    heroMediaType: property.hero_media_type ?? "image",
    desktopHeroVideoUrl: property.desktop_hero_video_url ?? "",
    mobileHeroVideoUrl: property.mobile_hero_video_url ?? "",
    desktopHeroImageId: property.desktop_hero_image_id ?? null,
    mobileHeroImageId: property.mobile_hero_image_id ?? null,
    posterImageId: property.poster_image_id ?? null,
    heroHeading: property.hero_heading ?? "",
    heroSubheading: property.hero_subheading ?? "",
    heroOverlayStrength: property.hero_overlay_strength ?? 40,
    heroTextAlign: property.hero_text_align ?? "left",
    heroTheme: property.hero_theme ?? "dark",

    masterPlanMediaId: property.master_plan_media_id ?? null,
    masterPlanTitle: property.master_plan_title ?? "",
    masterPlanDescription: property.master_plan_description ?? "",
    floorPlans: property.floor_plans ?? [],

    locationLandmarks: property.location_landmarks ?? [],
    videoExperience: property.video_experience ?? [],

    highlights: property.highlights ?? [],
    offers: property.offers ?? [],
    constructionUpdates: property.construction_updates ?? [],
    reraNumber: property.rera_number ?? "",
    approvalInfo: property.approval_info ?? "",
    disclaimerText: property.disclaimer_text ?? "",
    possessionDate: property.possession_date ?? "",
  }));
  const [galleryMediaIds, setGalleryMediaIds] = useState(
    [...property.gallery].sort((a, b) => a.position - b.position).map((g) => g.media_id)
  );
  const [seoDraft, setSeoDraft] = useState<Partial<SeoMeta>>(() => {
    const { id: _id, ...rest } = property.seo ?? ({} as SeoMeta);
    return rest;
  });

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
      description: draft.description || undefined,
      amenities: draft.amenities.filter((a) => a.name.trim()),
      tag_text: draft.tagText || undefined,
      status_text: draft.statusText || undefined,
      is_signature: draft.isSignature,
      featured_image_media_id: draft.featuredImageMediaId,
      brochure_media_id: draft.brochureMediaId,
      category_ids: draft.categoryIds,
      map_project_id: draft.mapProjectId,

      hero_media_type: draft.heroMediaType,
      desktop_hero_video_url: draft.desktopHeroVideoUrl || undefined,
      mobile_hero_video_url: draft.mobileHeroVideoUrl || undefined,
      desktop_hero_image_id: draft.desktopHeroImageId,
      mobile_hero_image_id: draft.mobileHeroImageId,
      poster_image_id: draft.posterImageId,
      hero_heading: draft.heroHeading || undefined,
      hero_subheading: draft.heroSubheading || undefined,
      hero_overlay_strength: draft.heroOverlayStrength,
      hero_text_align: draft.heroTextAlign,
      hero_theme: draft.heroTheme,

      master_plan_media_id: draft.masterPlanMediaId,
      master_plan_title: draft.masterPlanTitle || undefined,
      master_plan_description: draft.masterPlanDescription || undefined,
      floor_plans: draft.floorPlans,

      location_landmarks: draft.locationLandmarks,
      video_experience: draft.videoExperience,

      highlights: draft.highlights,
      offers: draft.offers,
      construction_updates: draft.constructionUpdates,
      rera_number: draft.reraNumber || undefined,
      approval_info: draft.approvalInfo || undefined,
      disclaimer_text: draft.disclaimerText || undefined,
      possession_date: draft.possessionDate || undefined,
    });
  }

  return (
    <div className="flex flex-col gap-4">
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

        <div className="w-full shrink-0 lg:w-80">
          <div className="rounded-lg border bg-white p-3">
            <GalleryManager
              mediaIds={galleryMediaIds}
              onChange={setGalleryMediaIds}
              isSaving={setGallery.isPending}
              onSave={() => setGallery.mutate(galleryMediaIds)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SeoPanel
          value={seoDraft}
          onChange={(patch) => setSeoDraft((prev) => ({ ...prev, ...patch }))}
          collapsedByDefault
        />
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          disabled={isSaving}
          onClick={() => onSave({ seo: seoDraft })}
        >
          Save SEO
        </Button>
      </div>
    </div>
  );
}
