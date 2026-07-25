"use client";

import { useId, useState } from "react";
import { TextField } from "@/components/forms/TextField";
import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { SelectField } from "@/components/forms/SelectField";
import { SerpPreview } from "@/components/seo/SerpPreview";
import { FacebookPreview } from "@/components/seo/FacebookPreview";
import { TwitterPreview } from "@/components/seo/TwitterPreview";
import { Globe, Share2, MessageCircle, Bot, Code, Eye } from "lucide-react";
import type { SeoMeta } from "@/types/page";

export interface SeoPanelValue {
  seo_title?: string | null;
  meta_description?: string | null;
  focus_keyword?: string | null;
  keywords?: string[] | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_media_id?: string | null;
  twitter_card_type?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image_media_id?: string | null;
  robots?: string | null;
  schema_jsonld?: Record<string, unknown> | null;
}

interface SeoPanelProps {
  value: SeoPanelValue | SeoMeta | null;
  onChange: (updated: SeoPanelValue) => void;
  slug?: string;
}

type TabType = "general" | "og" | "twitter" | "robots" | "schema" | "preview";

export function SeoPanel({ value, onChange, slug = "" }: SeoPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const tabSelectId = useId();

  const current: SeoPanelValue = value ?? {};

  const handleFieldChange = (field: keyof SeoPanelValue, val: unknown) => {
    onChange({
      ...current,
      [field]: val,
    });
  };

  // Parsing keywords array to comma string for input
  const keywordsString = Array.isArray(current.keywords) ? current.keywords.join(", ") : "";

  const handleKeywordsChange = (raw: string) => {
    const arr = raw.split(",").map((k) => k.trim()).filter(Boolean);
    handleFieldChange("keywords", arr.length > 0 ? arr : null);
  };

  // Robots directives toggles
  const currentRobots = current.robots ?? "index,follow";
  const isNoIndex = currentRobots.includes("noindex");
  const isNoFollow = currentRobots.includes("nofollow");

  const toggleRobotsDirective = (target: "noindex" | "nofollow") => {
    let nextIndex = isNoIndex;
    let nextFollow = isNoFollow;

    if (target === "noindex") nextIndex = !isNoIndex;
    if (target === "nofollow") nextFollow = !isNoFollow;

    const idxDirective = nextIndex ? "noindex" : "index";
    const followDirective = nextFollow ? "nofollow" : "follow";

    handleFieldChange("robots", `${idxDirective},${followDirective}`);
  };

  // Schema string parsing
  const schemaString = current.schema_jsonld
    ? JSON.stringify(current.schema_jsonld, null, 2)
    : "";

  const handleSchemaChange = (raw: string) => {
    try {
      const parsed = raw.trim() ? JSON.parse(raw) : null;
      handleFieldChange("schema_jsonld", parsed);
    } catch {
      // Invalid JSON typing ignored
    }
  };

  const TABS: Array<{ id: TabType; label: string; icon: typeof Globe }> = [
    { id: "general", label: "General SEO", icon: Globe },
    { id: "og", label: "Open Graph", icon: Share2 },
    { id: "twitter", label: "Twitter / X", icon: MessageCircle },
    { id: "robots", label: "Robots Directives", icon: Bot },
    { id: "schema", label: "Schema (JSON-LD)", icon: Code },
    { id: "preview", label: "Live Previews", icon: Eye },
  ];

  return (
    <div className="@container rounded-lg border bg-white shadow-sm overflow-hidden">
      {/* Panel Header & Navigation Tabs */}
      <div className="border-b bg-neutral-50 px-4 pt-3">
        {/* Narrow containers (e.g. the block-builder sidebar): a single-line dropdown
            instead of a button row, since 6 tabs can't fit without wrapping raggedly. */}
        <div className="pb-3 @lg:hidden">
          <label className="sr-only" htmlFor={tabSelectId}>
            SEO panel section
          </label>
          <select
            id={tabSelectId}
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabType)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Wide containers: the full horizontal tab row, single line, no wrap. */}
        <div className="hidden flex-nowrap items-center gap-1 @lg:flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-medium rounded-t-md border-b-2 transition-colors ${
                tab.id === "preview" ? "ml-auto" : ""
              } ${
                activeTab === tab.id
                  ? "border-neutral-900 bg-white text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {activeTab === "general" && (
          <div className="flex flex-col gap-4">
            <TextField
              label="SEO Meta Title"
              value={current.seo_title ?? ""}
              onChange={(e) => handleFieldChange("seo_title", e.target.value)}
              placeholder="e.g. Luxury Villas in Hyderabad | Truzon Homes"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-700">Meta Description</label>
              <textarea
                value={current.meta_description ?? ""}
                onChange={(e) => handleFieldChange("meta_description", e.target.value)}
                placeholder="Brief summary for search engines (150-160 characters recommended)."
                rows={3}
                className="w-full rounded-md border border-neutral-300 p-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Focus Keyword"
                value={current.focus_keyword ?? ""}
                onChange={(e) => handleFieldChange("focus_keyword", e.target.value)}
                placeholder="e.g. villa in Hyderabad"
              />
              <TextField
                label="Additional Keywords (comma separated)"
                value={keywordsString}
                onChange={(e) => handleKeywordsChange(e.target.value)}
                placeholder="real estate, 3bhk villa, luxury homes"
              />
            </div>
            <TextField
              label="Canonical URL"
              value={current.canonical_url ?? ""}
              onChange={(e) => handleFieldChange("canonical_url", e.target.value)}
              placeholder="https://truzonhomes.com/your-custom-canonical"
            />
          </div>
        )}

        {activeTab === "og" && (
          <div className="flex flex-col gap-4">
            <TextField
              label="Open Graph Title"
              value={current.og_title ?? current.seo_title ?? ""}
              onChange={(e) => handleFieldChange("og_title", e.target.value)}
              placeholder="Custom title for Facebook & LinkedIn sharing"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-700">Open Graph Description</label>
              <textarea
                value={current.og_description ?? current.meta_description ?? ""}
                onChange={(e) => handleFieldChange("og_description", e.target.value)}
                placeholder="Custom snippet displayed when shared on social platforms."
                rows={3}
                className="w-full rounded-md border border-neutral-300 p-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </div>
            <ImagePickerField
              label="Open Graph Share Image"
              mediaId={current.og_image_media_id ?? null}
              onChange={(val) => handleFieldChange("og_image_media_id", val.mediaId)}
            />
          </div>
        )}

        {activeTab === "twitter" && (
          <div className="flex flex-col gap-4">
            <SelectField
              label="Twitter Card Type"
              value={current.twitter_card_type ?? "summary_large_image"}
              onChange={(val) => handleFieldChange("twitter_card_type", val)}
              options={[
                { value: "summary_large_image", label: "Summary Card with Large Image" },
                { value: "summary", label: "Summary Card (Square Thumbnail)" },
              ]}
            />
            <TextField
              label="Twitter Card Title"
              value={current.twitter_title ?? current.seo_title ?? ""}
              onChange={(e) => handleFieldChange("twitter_title", e.target.value)}
              placeholder="Custom title for Twitter/X post cards"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-700">Twitter Description</label>
              <textarea
                value={current.twitter_description ?? current.meta_description ?? ""}
                onChange={(e) => handleFieldChange("twitter_description", e.target.value)}
                placeholder="Custom description for Twitter/X cards."
                rows={3}
                className="w-full rounded-md border border-neutral-300 p-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </div>
            <ImagePickerField
              label="Twitter Card Image"
              mediaId={current.twitter_image_media_id ?? null}
              onChange={(val) => handleFieldChange("twitter_image_media_id", val.mediaId)}
            />
          </div>
        )}

        {activeTab === "robots" && (
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-neutral-900">Search Engine Indexing Directives</h4>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={isNoIndex}
                  onChange={() => toggleRobotsDirective("noindex")}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-900">Noindex (Block indexing)</span>
                  <p className="text-xs text-neutral-500">
                    Instruct search engines NOT to show this page in search results.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={isNoFollow}
                  onChange={() => toggleRobotsDirective("nofollow")}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-900">Nofollow (Block link crawling)</span>
                  <p className="text-xs text-neutral-500">
                    Instruct search engines NOT to follow hyperlinks on this page.
                  </p>
                </div>
              </label>
            </div>
            <div className="text-xs text-neutral-400">
              Current directive string: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">{currentRobots}</code>
            </div>
          </div>
        )}

        {activeTab === "schema" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-900">Structured Data (JSON-LD Override)</h4>
              <span className="text-xs text-neutral-400">Valid JSON required</span>
            </div>
            <textarea
              defaultValue={schemaString}
              onBlur={(e) => handleSchemaChange(e.target.value)}
              placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Truzon Homes"\n}`}
              rows={8}
              className="w-full rounded-md border border-neutral-300 p-3 font-mono text-xs focus:border-neutral-900 focus:outline-none bg-neutral-900 text-emerald-400"
            />
            <p className="text-xs text-neutral-500">
              Leave blank to automatically use the global schema generator.
            </p>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
            <SerpPreview
              title={current.seo_title ?? ""}
              description={current.meta_description ?? ""}
              url={`https://truzonhomes.com/${slug}`}
            />
            <div className="flex flex-col gap-6">
              <FacebookPreview
                title={current.og_title ?? current.seo_title ?? ""}
                description={current.og_description ?? current.meta_description ?? ""}
              />
              <TwitterPreview
                title={current.twitter_title ?? current.seo_title ?? ""}
                description={current.twitter_description ?? current.meta_description ?? ""}
                cardType={current.twitter_card_type}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
