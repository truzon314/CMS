"use client";

import { useState, useEffect } from "react";
import { DocumentPickerField } from "@/components/forms/DocumentPickerField";
import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useTaxonomy";
import { useMediaItem } from "@/hooks/useMedia";
import { mappingService } from "@/services/mapping";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { BudgetBracket, PropertyAmenity } from "@/types/property";

export interface PropertyDetailsDraft {
  name: string;
  city: string;
  locationText: string;
  priceDisplay: string;
  priceValue: string;
  budgetBracket: BudgetBracket | "";
  specA: string;
  specB: string;
  areaSqft: string;
  bedsOptions: string;
  description: string;
  amenities: PropertyAmenity[];
  tagText: string;
  statusText: string;
  isSignature: boolean;
  categoryIds: string[];
  featuredImageUrl: string;
  featuredImageMediaId: string | null;
  brochureMediaId: string | null;
  mapProjectId: string | null;

  // Cinematic Hero Fields
  heroMediaType: "video" | "image" | "carousel";
  desktopHeroVideoUrl: string;
  mobileHeroVideoUrl: string;
  desktopHeroImageId: string | null;
  mobileHeroImageId: string | null;
  posterImageId: string | null;
  heroHeading: string;
  heroSubheading: string;
  heroOverlayStrength: number;
  heroTextAlign: "left" | "center" | "right";
  heroTheme: "dark" | "light";

  // Master Plan & Floor Plans
  masterPlanMediaId: string | null;
  masterPlanTitle: string;
  masterPlanDescription: string;
  floorPlans: any[];

  // Location & Videos
  locationLandmarks: any[];
  videoExperience: any[];

  // Marketing & Legal
  highlights: any[];
  offers: any[];
  constructionUpdates: any[];
  reraNumber: string;
  approvalInfo: string;
  disclaimerText: string;
  possessionDate: string;
}

const BROCHURE_MIME_TYPES = ["application/pdf"];

function BrochurePicker({
  mediaId,
  onChange,
}: {
  mediaId: string | null;
  onChange: (mediaId: string | null) => void;
}) {
  const { data: media } = useMediaItem(mediaId);
  return (
    <DocumentPickerField
      label="Brochure PDF (optional)"
      hint="Uploaded here becomes the public 'Download Brochure' file on this property's page."
      fileUrl={media?.url ?? null}
      fileName={media?.file_name ?? null}
      accept={BROCHURE_MIME_TYPES}
      onChange={(val) => onChange(val.mediaId)}
    />
  );
}

function AmenityImagePicker({
  mediaId,
  onChange,
}: {
  mediaId: string | null;
  onChange: (mediaId: string | null) => void;
}) {
  const { data: media } = useMediaItem(mediaId);
  return (
    <ImagePickerField
      label="Photo (optional)"
      recommendedDimensions="600 × 400 px"
      imageUrl={media?.url ?? ""}
      onChange={(val) => onChange(val.mediaId)}
    />
  );
}

function SingleImagePicker({
  label,
  mediaId,
  onChange,
}: {
  label: string;
  mediaId: string | null;
  onChange: (mediaId: string | null) => void;
}) {
  const { data: media } = useMediaItem(mediaId);
  return (
    <ImagePickerField
      label={label}
      imageUrl={media?.url ?? ""}
      onChange={(val) => onChange(val.mediaId)}
    />
  );
}

interface PropertyDetailsFormProps {
  draft: PropertyDetailsDraft;
  onChange: (patch: Partial<PropertyDetailsDraft>) => void;
}

const BUDGET_OPTIONS = [
  { value: "under2", label: "Under ₹2 Cr" },
  { value: "2to5", label: "₹2–5 Cr" },
  { value: "5to10", label: "₹5–10 Cr" },
  { value: "10plus", label: "₹10 Cr+" },
];

export function PropertyDetailsForm({ draft, onChange }: PropertyDetailsFormProps) {
  const { data: categories } = useCategories("property");
  const [mapProjects, setMapProjects] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<
    "details" | "hero" | "plans" | "landmarks" | "videos" | "offers" | "legal"
  >("details");

  useEffect(() => {
    mappingService.listProjects()
      .then((projects) => setMapProjects(projects))
      .catch(console.error);
  }, []);

  const TABS = [
    { id: "details", label: "Basic Details" },
    { id: "hero", label: "Cinematic Hero" },
    { id: "plans", label: "Master & Floor Plans" },
    { id: "landmarks", label: "Location & Connectivity" },
    { id: "videos", label: "Video Experience" },
    { id: "offers", label: "Highlights & Offers" },
    { id: "legal", label: "Construction & Legal" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-neutral-200 gap-1 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${
              activeTab === tab.id
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Basic Details */}
      {activeTab === "details" && (
        <div className="flex flex-col gap-3">
          <TextField id="property_name" label="Name" value={draft.name} onChange={(e) => onChange({ name: e.target.value })} />
          <TextField id="property_city" label="City" value={draft.city} onChange={(e) => onChange({ city: e.target.value })} />
          <TextField
            id="property_location"
            label="Location"
            value={draft.locationText}
            onChange={(e) => onChange({ locationText: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              id="property_price_display"
              label="Price (display)"
              placeholder="₹4.5 Cr+"
              value={draft.priceDisplay}
              onChange={(e) => onChange({ priceDisplay: e.target.value })}
            />
            <TextField
              id="property_price_value"
              label="Price (numeric, for sorting)"
              type="number"
              value={draft.priceValue}
              onChange={(e) => onChange({ priceValue: e.target.value })}
            />
          </div>
          <SelectField
            id="property_budget_bracket"
            label="Budget bracket"
            value={draft.budgetBracket}
            onChange={(v) => onChange({ budgetBracket: v as BudgetBracket })}
            options={BUDGET_OPTIONS}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField id="property_spec_a" label="Spec A (e.g. 4 BHK)" value={draft.specA} onChange={(e) => onChange({ specA: e.target.value })} />
            <TextField id="property_spec_b" label="Spec B (e.g. 3500 Sq.Ft)" value={draft.specB} onChange={(e) => onChange({ specB: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              id="property_area"
              label="Area (sq ft)"
              type="number"
              value={draft.areaSqft}
              onChange={(e) => onChange({ areaSqft: e.target.value })}
            />
            <TextField
              id="property_beds"
              label="Bed options (comma separated, e.g. 3, 4)"
              value={draft.bedsOptions}
              onChange={(e) => onChange({ bedsOptions: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="property_description">Description</Label>
            <Textarea
              id="property_description"
              rows={5}
              placeholder="What makes this property worth a site visit?"
              value={draft.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Amenities</Label>
            <RepeatableItemList<PropertyAmenity>
              items={draft.amenities}
              onChange={(amenities) => onChange({ amenities })}
              newItem={() => ({ name: "", image_media_id: null })}
              addLabel="Add Amenity"
              itemLabel={(i) => draft.amenities[i]?.name || `Amenity ${i + 1}`}
              renderItem={(item, update) => (
                <div className="flex flex-col gap-2">
                  <TextField
                    label="Name"
                    value={item.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="e.g. Rooftop infinity pool"
                  />
                  <AmenityImagePicker
                    mediaId={item.image_media_id}
                    onChange={(image_media_id) => update({ image_media_id })}
                  />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              id="property_tag_text"
              label="Tag badge text (e.g. EXCLUSIVE)"
              value={draft.tagText}
              onChange={(e) => onChange({ tagText: e.target.value })}
            />
            <TextField
              id="property_status_text"
              label="Status badge text (e.g. Ready to Move)"
              value={draft.statusText}
              onChange={(e) => onChange({ statusText: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="property_is_signature"
              checked={draft.isSignature}
              onCheckedChange={(checked) => onChange({ isSignature: checked === true })}
            />
            <Label htmlFor="property_is_signature" className="font-normal">
              Signature property (highlighted)
            </Label>
          </div>

          <ImagePickerField
            label="Featured image"
            recommendedDimensions="1200 × 800 px (16:9)"
            imageUrl={draft.featuredImageUrl}
            onChange={({ url, mediaId }) => onChange({ featuredImageUrl: url, featuredImageMediaId: mediaId })}
          />

          <BrochurePicker mediaId={draft.brochureMediaId} onChange={(brochureMediaId) => onChange({ brochureMediaId })} />

          <SelectField
            id="property_map_project"
            label="Linked Map Layout (Optional)"
            value={draft.mapProjectId || ""}
            onChange={(val) => onChange({ mapProjectId: val || null })}
            options={[
              { value: "", label: "-- None --" },
              ...mapProjects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />

          <div className="flex flex-col gap-1.5">
            <Label>Type / Categories</Label>
            <div className="flex flex-col gap-1.5 rounded-md border p-2.5">
              {(categories ?? []).map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`property_category_${category.id}`}
                    checked={draft.categoryIds.includes(category.id)}
                    onCheckedChange={() =>
                      onChange({
                        categoryIds: draft.categoryIds.includes(category.id)
                          ? draft.categoryIds.filter((id) => id !== category.id)
                          : [...draft.categoryIds, category.id],
                      })
                    }
                  />
                  <Label htmlFor={`property_category_${category.id}`} className="font-normal">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hero & Cinematic Media */}
      {activeTab === "hero" && (
        <div className="flex flex-col gap-3">
          <SelectField
            id="hero_media_type"
            label="Hero Media Type"
            value={draft.heroMediaType}
            onChange={(v) => onChange({ heroMediaType: v as any })}
            options={[
              { value: "image", label: "Hero Image" },
              { value: "video", label: "Full-Screen Autoplay Video" },
              { value: "carousel", label: "Image Carousel" },
            ]}
          />

          <TextField
            id="desktop_hero_video_url"
            label="Desktop Hero Video URL (.mp4 / R2 CDN URL)"
            placeholder="https://storage.truzonhomes.com/videos/hero-desktop.mp4"
            value={draft.desktopHeroVideoUrl}
            onChange={(e) => onChange({ desktopHeroVideoUrl: e.target.value })}
          />

          <TextField
            id="mobile_hero_video_url"
            label="Mobile Hero Video URL (.mp4 / R2 CDN URL)"
            placeholder="https://storage.truzonhomes.com/videos/hero-mobile.mp4"
            value={draft.mobileHeroVideoUrl}
            onChange={(e) => onChange({ mobileHeroVideoUrl: e.target.value })}
          />

          <SingleImagePicker
            label="Desktop Hero Image"
            mediaId={draft.desktopHeroImageId}
            onChange={(mediaId) => onChange({ desktopHeroImageId: mediaId })}
          />

          <SingleImagePicker
            label="Mobile Hero Image"
            mediaId={draft.mobileHeroImageId}
            onChange={(mediaId) => onChange({ mobileHeroImageId: mediaId })}
          />

          <SingleImagePicker
            label="Video Poster Image (loads before video)"
            mediaId={draft.posterImageId}
            onChange={(mediaId) => onChange({ posterImageId: mediaId })}
          />

          <TextField
            id="hero_heading"
            label="Hero Custom Heading (Optional)"
            placeholder={draft.name}
            value={draft.heroHeading}
            onChange={(e) => onChange({ heroHeading: e.target.value })}
          />

          <TextField
            id="hero_subheading"
            label="Hero Custom Subheading (Optional)"
            placeholder={draft.locationText || "Luxury Gated Community"}
            value={draft.heroSubheading}
            onChange={(e) => onChange({ heroSubheading: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SelectField
              id="hero_text_align"
              label="Text Alignment"
              value={draft.heroTextAlign}
              onChange={(v) => onChange({ heroTextAlign: v as any })}
              options={[
                { value: "left", label: "Left Aligned" },
                { value: "center", label: "Center Aligned" },
                { value: "right", label: "Right Aligned" },
              ]}
            />
            <SelectField
              id="hero_theme"
              label="Text Theme"
              value={draft.heroTheme}
              onChange={(v) => onChange({ heroTheme: v as any })}
              options={[
                { value: "dark", label: "Dark Background (White Text)" },
                { value: "light", label: "Light Background (Dark Text)" },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Master & Floor Plans */}
      {activeTab === "plans" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border p-3 bg-neutral-50 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Master Layout Plan</h4>
            <TextField
              id="master_plan_title"
              label="Master Plan Title"
              value={draft.masterPlanTitle}
              onChange={(e) => onChange({ masterPlanTitle: e.target.value })}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="master_plan_desc">Master Plan Description</Label>
              <Textarea
                id="master_plan_desc"
                rows={3}
                value={draft.masterPlanDescription}
                onChange={(e) => onChange({ masterPlanDescription: e.target.value })}
              />
            </div>

            <SingleImagePicker
              label="Master Plan Image"
              mediaId={draft.masterPlanMediaId}
              onChange={(mediaId) => onChange({ masterPlanMediaId: mediaId })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold">Floor / Plot Plans</Label>
            <RepeatableItemList<any>
              items={draft.floorPlans}
              onChange={(floorPlans) => onChange({ floorPlans })}
              newItem={() => ({ name: "", type: "VILLA", config: "", area: "", price: "", image_media_id: null })}
              addLabel="Add Floor Plan"
              itemLabel={(i) => draft.floorPlans[i]?.name || `Plan ${i + 1}`}
              renderItem={(item, update) => (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <TextField label="Plan Name (e.g. 165 Sq.Yd East Facing)" value={item.name || ""} onChange={(e) => update({ name: e.target.value })} />
                    <TextField label="Configuration (e.g. 4 BHK Triplex)" value={item.config || ""} onChange={(e) => update({ config: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <TextField label="Built-Up Area / Plot Size" value={item.area || ""} onChange={(e) => update({ area: e.target.value })} />
                    <TextField label="Price (optional)" value={item.price || ""} onChange={(e) => update({ price: e.target.value })} />
                  </div>
                  <SingleImagePicker
                    label="Floor Plan Image"
                    mediaId={item.image_media_id || null}
                    onChange={(image_media_id) => update({ image_media_id })}
                  />
                </div>
              )}
            />
          </div>
        </div>
      )}

      {/* Tab 4: Location & Connectivity */}
      {activeTab === "landmarks" && (
        <div className="flex flex-col gap-3">
          <Label className="font-semibold">Nearby Landmarks & Connectivity</Label>
          <RepeatableItemList<any>
            items={draft.locationLandmarks}
            onChange={(locationLandmarks) => onChange({ locationLandmarks })}
            newItem={() => ({ name: "", category: "School", distance: "5 Mins", travel_time: "" })}
            addLabel="Add Landmark"
            itemLabel={(i) => draft.locationLandmarks[i]?.name || `Landmark ${i + 1}`}
            renderItem={(item, update) => (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <TextField label="Landmark Name (e.g. Oakridge Int. School)" value={item.name || ""} onChange={(e) => update({ name: e.target.value })} />
                <SelectField
                  label="Category"
                  value={item.category || "School"}
                  onChange={(v) => update({ category: v })}
                  options={[
                    { value: "School", label: "School / University" },
                    { value: "Hospital", label: "Hospital / Healthcare" },
                    { value: "IT Hub", label: "IT Hub / Work" },
                    { value: "Highway", label: "Highway / ORR" },
                    { value: "Metro", label: "Metro / Transport" },
                    { value: "Airport", label: "Airport" },
                    { value: "Shopping", label: "Shopping / Mall" },
                  ]}
                />
                <TextField label="Distance / Time (e.g. 10 Mins / 4 km)" value={item.distance || ""} onChange={(e) => update({ distance: e.target.value })} />
              </div>
            )}
          />
        </div>
      )}

      {/* Tab 5: Video Experience */}
      {activeTab === "videos" && (
        <div className="flex flex-col gap-3">
          <Label className="font-semibold">Categorized Video Experience</Label>
          <RepeatableItemList<any>
            items={draft.videoExperience}
            onChange={(videoExperience) => onChange({ videoExperience })}
            newItem={() => ({ title: "", category: "Walkthrough", video_url: "", poster_media_id: null })}
            addLabel="Add Video"
            itemLabel={(i) => draft.videoExperience[i]?.title || `Video ${i + 1}`}
            renderItem={(item, update) => (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <TextField label="Video Title (e.g. Model Villa Walkthrough)" value={item.title || ""} onChange={(e) => update({ title: e.target.value })} />
                  <SelectField
                    label="Category"
                    value={item.category || "Walkthrough"}
                    onChange={(v) => update({ category: v })}
                    options={[
                      { value: "Walkthrough", label: "Villa / House Walkthrough" },
                      { value: "Drone View", label: "Drone Aerial View" },
                      { value: "Project Film", label: "Cinematic Brand Film" },
                      { value: "Construction", label: "Construction Progress" },
                      { value: "Testimonial", label: "Customer Testimonial" },
                    ]}
                  />
                </div>
                <TextField label="Video Direct URL (.mp4 or streaming link)" value={item.video_url || ""} onChange={(e) => update({ video_url: e.target.value })} />
                <SingleImagePicker
                  label="Custom Thumbnail Poster"
                  mediaId={item.poster_media_id || null}
                  onChange={(poster_media_id) => update({ poster_media_id })}
                />
              </div>
            )}
          />
        </div>
      )}

      {/* Tab 6: Highlights & Offers */}
      {activeTab === "offers" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold">Project Highlights (Badges)</Label>
            <RepeatableItemList<any>
              items={draft.highlights}
              onChange={(highlights) => onChange({ highlights })}
              newItem={() => ({ label: "", value: "" })}
              addLabel="Add Highlight"
              itemLabel={(i) => draft.highlights[i]?.label || `Highlight ${i + 1}`}
              renderItem={(item, update) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <TextField label="Label (e.g. Total Area)" value={item.label || ""} onChange={(e) => update({ label: e.target.value })} />
                  <TextField label="Value (e.g. 25 Acres)" value={item.value || ""} onChange={(e) => update({ value: e.target.value })} />
                </div>
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold">Active Offers & Marketing Banners</Label>
            <RepeatableItemList<any>
              items={draft.offers}
              onChange={(offers) => onChange({ offers })}
              newItem={() => ({ title: "", description: "", desktop_creative_media_id: null, valid_until: "" })}
              addLabel="Add Offer Campaign"
              itemLabel={(i) => draft.offers[i]?.title || `Offer ${i + 1}`}
              renderItem={(item, update) => (
                <div className="flex flex-col gap-2">
                  <TextField label="Campaign Title (e.g. Early Bird Festival Offer)" value={item.title || ""} onChange={(e) => update({ title: e.target.value })} />
                  <TextField label="Description (e.g. Save up to ₹5 Lakhs on Booking)" value={item.description || ""} onChange={(e) => update({ description: e.target.value })} />
                  <TextField label="Valid Until Date (e.g. 2026-10-31)" value={item.valid_until || ""} onChange={(e) => update({ valid_until: e.target.value })} />
                  <SingleImagePicker
                    label="Offer Banner Creative"
                    mediaId={item.desktop_creative_media_id || null}
                    onChange={(desktop_creative_media_id) => update({ desktop_creative_media_id })}
                  />
                </div>
              )}
            />
          </div>
        </div>
      )}

      {/* Tab 7: Construction & Legal */}
      {activeTab === "legal" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <TextField id="rera_number" label="RERA Registration Number" placeholder="P02400001234" value={draft.reraNumber} onChange={(e) => onChange({ reraNumber: e.target.value })} />
            <TextField id="approval_info" label="Approval Body (e.g. DTCP & RERA Approved)" value={draft.approvalInfo} onChange={(e) => onChange({ approvalInfo: e.target.value })} />
            <TextField id="possession_date" label="Possession Date / Status" placeholder="Ready to Move / Dec 2026" value={draft.possessionDate} onChange={(e) => onChange({ possessionDate: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="disclaimer_text">Legal Disclaimer Text</Label>
              <Textarea id="disclaimer_text" rows={3} value={draft.disclaimerText} onChange={(e) => onChange({ disclaimerText: e.target.value })} />
            </div>

          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold">Construction Timeline Updates</Label>
            <RepeatableItemList<any>
              items={draft.constructionUpdates}
              onChange={(constructionUpdates) => onChange({ constructionUpdates })}
              newItem={() => ({ date: "", stage: "Phase 1 Structure Complete", progress: "75%" })}
              addLabel="Add Progress Update"
              itemLabel={(i) => draft.constructionUpdates[i]?.stage || `Update ${i + 1}`}

              renderItem={(item, update) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <TextField label="Date (e.g. Sep 2026)" value={item.date || ""} onChange={(e) => update({ date: e.target.value })} />
                  <TextField label="Stage Title" value={item.stage || ""} onChange={(e) => update({ stage: e.target.value })} />
                  <TextField label="Progress %" value={item.progress || ""} onChange={(e) => update({ progress: e.target.value })} />
                </div>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
