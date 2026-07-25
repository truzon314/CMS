"use client";

import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useTaxonomy";
import type { BudgetBracket } from "@/types/property";

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
  tagText: string;
  statusText: string;
  isSignature: boolean;
  categoryIds: string[];
  featuredImageUrl: string;
  featuredImageMediaId: string | null;
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

  return (
    <div className="flex flex-col gap-3">
      <TextField id="property_name" label="Name" value={draft.name} onChange={(e) => onChange({ name: e.target.value })} />
      <TextField id="property_city" label="City" value={draft.city} onChange={(e) => onChange({ city: e.target.value })} />
      <TextField
        id="property_location"
        label="Location"
        value={draft.locationText}
        onChange={(e) => onChange({ locationText: e.target.value })}
      />
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
      <SelectField
        id="property_budget_bracket"
        label="Budget bracket"
        value={draft.budgetBracket}
        onChange={(v) => onChange({ budgetBracket: v as BudgetBracket })}
        options={BUDGET_OPTIONS}
      />
      <TextField id="property_spec_a" label="Spec A (e.g. 4 BHK)" value={draft.specA} onChange={(e) => onChange({ specA: e.target.value })} />
      <TextField id="property_spec_b" label="Spec B (e.g. 3500 Sq.Ft)" value={draft.specB} onChange={(e) => onChange({ specB: e.target.value })} />
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
        imageUrl={draft.featuredImageUrl}
        onChange={({ url, mediaId }) => onChange({ featuredImageUrl: url, featuredImageMediaId: mediaId })}
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
          {(categories ?? []).length === 0 ? <p className="text-xs text-neutral-500">No property types yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
