"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/forms/RichTextEditor";
import { SeoPanel } from "@/components/ui/seo-panel";
import { Textarea } from "@/components/ui/textarea";
import { useMediaItem } from "@/hooks/useMedia";
import type { BlogPostUpdatePayload } from "@/services/blog";
import { PostMetaPanel } from "@/modules/blog/PostMetaPanel";
import type { BlogPost } from "@/types/blog";
import type { SeoMeta } from "@/types/page";

interface BlogPostContentEditorProps {
  post: BlogPost;
  authorName: string;
  isSaving: boolean;
  onSave: (payload: BlogPostUpdatePayload) => void;
}

export function BlogPostContentEditor({ post, authorName, isSaving, onSave }: BlogPostContentEditorProps) {
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [body, setBody] = useState(post.body ?? "");
  const [categoryIds, setCategoryIds] = useState(post.categories.map((c) => c.id));
  const [tagIds, setTagIds] = useState(post.tags.map((t) => t.id));
  const [featuredImageUrlOverride, setFeaturedImageUrlOverride] = useState<string | null>(null);
  const [featuredImageMediaId, setFeaturedImageMediaId] = useState<string | null>(post.featured_image_media_id);
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(post.reading_time_minutes);
  const [seoDraft, setSeoDraft] = useState<Partial<SeoMeta>>(() => {
    const { id: _id, ...rest } = post.seo ?? ({} as SeoMeta);
    return rest;
  });

  // The API only stores `featured_image_media_id` (ERD.md) — resolve its URL
  // for display until the user picks a new image (which gives us the URL directly).
  const { data: currentFeaturedImage } = useMediaItem(
    featuredImageUrlOverride === null ? post.featured_image_media_id : null
  );
  const featuredImageUrl = featuredImageUrlOverride ?? currentFeaturedImage?.url ?? "";

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="post_excerpt">Excerpt</Label>
          <Textarea id="post_excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Body</Label>
          <RichTextEditor value={body} onChange={setBody} />
        </div>

        <Button
          disabled={isSaving}
          className="self-start"
          onClick={() =>
            onSave({
              excerpt,
              body,
              category_ids: categoryIds,
              tag_ids: tagIds,
              featured_image_media_id: featuredImageMediaId,
              reading_time_minutes: readingTimeMinutes,
            })
          }
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="w-full shrink-0 flex flex-col gap-4 lg:w-72">
        <PostMetaPanel
          authorName={authorName}
          categoryIds={categoryIds}
          tagIds={tagIds}
          featuredImageUrl={featuredImageUrl}
          readingTimeMinutes={readingTimeMinutes}
          onCategoryIdsChange={setCategoryIds}
          onTagIdsChange={setTagIds}
          onFeaturedImageChange={({ url, mediaId }) => {
            setFeaturedImageUrlOverride(url);
            setFeaturedImageMediaId(mediaId);
          }}
          onReadingTimeChange={setReadingTimeMinutes}
        />

        <SeoPanel
          value={seoDraft}
          onChange={(patch) => setSeoDraft((prev) => ({ ...prev, ...patch }))}
          collapsedByDefault
        />
        <Button
          variant="outline"
          size="sm"
          disabled={isSaving}
          onClick={() => onSave({ seo: seoDraft })}
        >
          Save SEO
        </Button>
      </div>
    </div>
  );
}
