"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMediaItem } from "@/hooks/useMedia";
import type { Settings, SettingsUpdatePayload } from "@/types/settings";

interface SeoSettingsFormProps { settings: Settings; isSaving: boolean; onSave: (payload: SettingsUpdatePayload) => void; }

export function SeoSettingsForm({ settings, isSaving, onSave }: SeoSettingsFormProps) {
  const [draft, setDraft] = useState({
    default_meta_title: settings.default_meta_title ?? "", default_meta_description: settings.default_meta_description ?? "",
    default_keywords: (settings.default_keywords ?? []).join(", "), default_canonical_url: settings.default_canonical_url ?? "",
    organization_name: settings.organization_name ?? "", google_verification_code: settings.google_verification_code ?? "",
    bing_verification_code: settings.bing_verification_code ?? "", google_tag_manager_id: settings.google_tag_manager_id ?? "",
    meta_pixel_id: settings.meta_pixel_id ?? "", google_search_console_verification: settings.google_search_console_verification ?? "",
    twitter_card_default_type: settings.twitter_card_default_type ?? "summary_large_image", robots_txt_content: settings.robots_txt_content ?? "",
    working_hours: settings.working_hours ?? "", latitude: settings.latitude?.toString() ?? "", longitude: settings.longitude?.toString() ?? "",
    service_areas: (settings.service_areas ?? []).join(", "),
  });
  const [ogMediaId, setOgMediaId] = useState(settings.og_default_image_media_id);
  const [ogUrlOverride, setOgUrlOverride] = useState<string | null>(null);
  const { data: currentOgImage } = useMediaItem(ogUrlOverride === null ? settings.og_default_image_media_id : null);
  const set = (key: keyof typeof draft, value: string) => setDraft((previous) => ({ ...previous, [key]: value }));

  return <div className="flex max-w-2xl flex-col gap-3">
    <TextField id="default_meta_title" label="Default meta title" maxLength={255} value={draft.default_meta_title} onChange={(e) => set("default_meta_title", e.target.value)} />
    <div className="flex flex-col gap-1.5"><Label htmlFor="default_meta_description">Default meta description</Label><Textarea id="default_meta_description" rows={3} maxLength={500} value={draft.default_meta_description} onChange={(e) => set("default_meta_description", e.target.value)} /></div>
    <TextField id="default_keywords" label="Default keywords (comma separated)" value={draft.default_keywords} onChange={(e) => set("default_keywords", e.target.value)} />
    <TextField id="default_canonical_url" label="Canonical site URL" placeholder="https://example.com" value={draft.default_canonical_url} onChange={(e) => set("default_canonical_url", e.target.value)} />
    <TextField id="organization_name" label="Organization name" value={draft.organization_name} onChange={(e) => set("organization_name", e.target.value)} />
    <ImagePickerField label="Default Open Graph image" recommendedDimensions="1200 × 630 px (Social Share)" imageUrl={ogUrlOverride ?? currentOgImage?.url ?? ""} onChange={({ url, mediaId }) => { setOgUrlOverride(url); setOgMediaId(mediaId); }} />
    <label className="flex flex-col gap-1.5 text-sm"><span>Default Twitter card</span><select className="h-9 rounded-md border bg-white px-2" value={draft.twitter_card_default_type} onChange={(e) => set("twitter_card_default_type", e.target.value)}><option value="summary_large_image">Summary large image</option><option value="summary">Summary</option></select></label>
    <TextField id="google_verification_code" label="Google verification code" value={draft.google_verification_code} onChange={(e) => set("google_verification_code", e.target.value)} />
    <TextField id="bing_verification_code" label="Bing verification code" value={draft.bing_verification_code} onChange={(e) => set("bing_verification_code", e.target.value)} />
    <TextField id="google_search_console_verification" label="Google Search Console verification" value={draft.google_search_console_verification} onChange={(e) => set("google_search_console_verification", e.target.value)} />
    <TextField id="google_tag_manager_id" label="Google Tag Manager ID" placeholder="GTM-XXXXXXX" value={draft.google_tag_manager_id} onChange={(e) => set("google_tag_manager_id", e.target.value)} />
    <TextField id="meta_pixel_id" label="Meta Pixel ID" value={draft.meta_pixel_id} onChange={(e) => set("meta_pixel_id", e.target.value)} />
    <div className="flex flex-col gap-1.5"><Label htmlFor="robots_txt_content">Robots.txt content</Label><Textarea id="robots_txt_content" rows={8} value={draft.robots_txt_content} placeholder="User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml" onChange={(e) => set("robots_txt_content", e.target.value)} /></div>
    <TextField id="working_hours" label="Working hours" value={draft.working_hours} onChange={(e) => set("working_hours", e.target.value)} />
    <div className="grid gap-3 sm:grid-cols-2"><TextField id="latitude" label="Latitude" inputMode="decimal" value={draft.latitude} onChange={(e) => set("latitude", e.target.value)} /><TextField id="longitude" label="Longitude" inputMode="decimal" value={draft.longitude} onChange={(e) => set("longitude", e.target.value)} /></div>
    <TextField id="service_areas" label="Service areas (comma separated)" value={draft.service_areas} onChange={(e) => set("service_areas", e.target.value)} />
    <Button className="self-start" disabled={isSaving} onClick={() => onSave({ ...draft, default_keywords: draft.default_keywords.split(",").map((value) => value.trim()).filter(Boolean), service_areas: draft.service_areas.split(",").map((value) => value.trim()).filter(Boolean), latitude: draft.latitude ? Number(draft.latitude) : null, longitude: draft.longitude ? Number(draft.longitude) : null, og_default_image_media_id: ogMediaId })}>{isSaving ? "Saving…" : "Save SEO Settings"}</Button>
  </div>;
}
