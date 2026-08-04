"use client";

import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { TextField } from "@/components/forms/TextField";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCategories, useTags } from "@/hooks/useTaxonomy";

interface PostMetaPanelProps {
  authorName: string;
  categoryIds: string[];
  tagIds: string[];
  featuredImageUrl: string;
  readingTimeMinutes: number | null;
  onCategoryIdsChange: (ids: string[]) => void;
  onTagIdsChange: (ids: string[]) => void;
  onFeaturedImageChange: (value: { url: string; mediaId: string | null }) => void;
  onReadingTimeChange: (minutes: number | null) => void;
}

export function PostMetaPanel({
  authorName,
  categoryIds,
  tagIds,
  featuredImageUrl,
  readingTimeMinutes,
  onCategoryIdsChange,
  onTagIdsChange,
  onFeaturedImageChange,
  onReadingTimeChange,
}: PostMetaPanelProps) {
  const { data: categories } = useCategories("blog");
  const { data: tags } = useTags();

  function toggle(ids: string[], id: string, onChange: (ids: string[]) => void) {
    onChange(ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-white p-4">
      <div className="flex flex-col gap-1.5">
        <Label>Author</Label>
        <p className="text-sm text-neutral-700">{authorName}</p>
      </div>

      <ImagePickerField
        label="Featured image"
        recommendedDimensions="1200 × 675 px (16:9)"
        imageUrl={featuredImageUrl}
        onChange={onFeaturedImageChange}
      />

      <TextField
        id="reading_time"
        label="Reading time (minutes) — leave blank to auto-compute"
        type="number"
        min={1}
        value={readingTimeMinutes ?? ""}
        onChange={(e) => onReadingTimeChange(e.target.value ? Number(e.target.value) : null)}
      />

      <div className="flex flex-col gap-1.5">
        <Label>Categories</Label>
        <div className="flex flex-col gap-1.5 rounded-md border p-2.5">
          {(categories ?? []).map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                id={`post_category_${category.id}`}
                checked={categoryIds.includes(category.id)}
                onCheckedChange={() => toggle(categoryIds, category.id, onCategoryIdsChange)}
              />
              <Label htmlFor={`post_category_${category.id}`} className="font-normal">
                {category.name}
              </Label>
            </div>
          ))}
          {(categories ?? []).length === 0 ? <p className="text-xs text-neutral-500">No categories yet.</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tags</Label>
        <div className="flex flex-col gap-1.5 rounded-md border p-2.5">
          {(tags ?? []).map((tag) => (
            <div key={tag.id} className="flex items-center gap-2">
              <Checkbox
                id={`post_tag_${tag.id}`}
                checked={tagIds.includes(tag.id)}
                onCheckedChange={() => toggle(tagIds, tag.id, onTagIdsChange)}
              />
              <Label htmlFor={`post_tag_${tag.id}`} className="font-normal">
                {tag.name}
              </Label>
            </div>
          ))}
          {(tags ?? []).length === 0 ? <p className="text-xs text-neutral-500">No tags yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
