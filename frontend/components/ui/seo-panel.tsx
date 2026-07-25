"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SeoPanel as RichSeoPanel, type SeoPanelValue } from "@/components/seo/SeoPanel";
import type { SeoMeta } from "@/types/page";

interface SeoPanelProps {
  value: Partial<SeoMeta> | null;
  onChange: (seo: Partial<SeoMeta>) => void;
  collapsedByDefault?: boolean;
  slug?: string;
}

/** Shared, editable SEO surface used by Page, Blog and Property editors. */
export function SeoPanel({ value, onChange, collapsedByDefault = true, slug = "" }: SeoPanelProps) {
  const [open, setOpen] = useState(!collapsedByDefault);

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-900 bg-neutral-50 hover:bg-neutral-100 transition-colors border-b"
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          SEO & Social Metadata
        </span>
        <span className="text-xs text-neutral-500 font-normal">SERP, OpenGraph, Twitter, Schema & Previews</span>
      </button>

      {open ? (
        <div className="p-4">
          <RichSeoPanel
            value={value as SeoPanelValue}
            onChange={(updated) => onChange(updated as Partial<SeoMeta>)}
            slug={slug}
          />
        </div>
      ) : null}
    </div>
  );
}
