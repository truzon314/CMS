"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TextField } from "@/components/forms/TextField";
import type { SeoMeta } from "@/types/page";

interface SeoPanelProps {
  value: Partial<SeoMeta> | null;
  onChange: (seo: Partial<SeoMeta>) => void;
  collapsedByDefault?: boolean;
}

/** REUSABLE_COMPONENTS.md's `SeoPanel` — shared across Pages/Blog/Properties editors.
 * OG image picker and the raw JSON-LD editor are deferred until Media Library
 * (Phase 3) exists; everything else is real.
 */
export function SeoPanel({ value, onChange, collapsedByDefault = true }: SeoPanelProps) {
  const [open, setOpen] = useState(!collapsedByDefault);
  const keywordsText = (value?.keywords ?? []).join(", ");

  return (
    <div className="rounded-lg border bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium"
      >
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        SEO
      </button>
      {open ? (
        <div className="flex flex-col gap-3 border-t px-4 py-4">
          <TextField
            id="seo_title"
            label="SEO title"
            value={value?.seo_title ?? ""}
            onChange={(e) => onChange({ seo_title: e.target.value })}
          />
          <TextField
            id="seo_meta_description"
            label="Meta description"
            value={value?.meta_description ?? ""}
            onChange={(e) => onChange({ meta_description: e.target.value })}
          />
          <TextField
            id="seo_keywords"
            label="Keywords (comma separated)"
            value={keywordsText}
            onChange={(e) =>
              onChange({
                keywords: e.target.value
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean),
              })
            }
          />
          <TextField
            id="seo_canonical_url"
            label="Canonical URL"
            value={value?.canonical_url ?? ""}
            onChange={(e) => onChange({ canonical_url: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
