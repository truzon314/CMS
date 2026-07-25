"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { AccordionBlockEditor } from "@/modules/pages/blocks/AccordionBlockEditor";
import { ContactFormBlockEditor } from "@/modules/pages/blocks/ContactFormBlockEditor";
import { CtaBlockEditor } from "@/modules/pages/blocks/CtaBlockEditor";
import { DividerBlockEditor } from "@/modules/pages/blocks/DividerBlockEditor";
import { FaqBlockEditor } from "@/modules/pages/blocks/FaqBlockEditor";
import { FeaturesBlockEditor } from "@/modules/pages/blocks/FeaturesBlockEditor";
import { GalleryBlockEditor } from "@/modules/pages/blocks/GalleryBlockEditor";
import { HeroBannerBlockEditor } from "@/modules/pages/blocks/HeroBannerBlockEditor";
import { ImageBlockEditor } from "@/modules/pages/blocks/ImageBlockEditor";
import { MapBlockEditor } from "@/modules/pages/blocks/MapBlockEditor";
import { PricingBlockEditor } from "@/modules/pages/blocks/PricingBlockEditor";
import { SpacerBlockEditor } from "@/modules/pages/blocks/SpacerBlockEditor";
import { StatisticsBlockEditor } from "@/modules/pages/blocks/StatisticsBlockEditor";
import { TeamBlockEditor } from "@/modules/pages/blocks/TeamBlockEditor";
import { TestimonialsBlockEditor } from "@/modules/pages/blocks/TestimonialsBlockEditor";
import { TextBlockEditor } from "@/modules/pages/blocks/TextBlockEditor";
import { TimelineBlockEditor } from "@/modules/pages/blocks/TimelineBlockEditor";
import { VideoBlockEditor } from "@/modules/pages/blocks/VideoBlockEditor";
import { DEFAULT_CONFIGS } from "@/modules/pages/blocks/defaultConfigs";
import type { BlockDefinition, PageBlock } from "@/types/page";

interface EditorProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

// Every block editor shares this exact `{config, onChange}` shape, so one map
// replaces an 18-case switch. Each editor's own props are more narrowly typed
// (e.g. `HeroBannerConfig`), which structurally satisfies `EditorProps`.
function asEditor<T>(Component: ComponentType<{ config: T; onChange: (config: T) => void }>) {
  return Component as ComponentType<EditorProps>;
}

const BLOCK_EDITORS: Record<string, ComponentType<EditorProps>> = {
  hero_banner: asEditor(HeroBannerBlockEditor),
  text: asEditor(TextBlockEditor),
  image: asEditor(ImageBlockEditor),
  gallery: asEditor(GalleryBlockEditor),
  video: asEditor(VideoBlockEditor),
  faq: asEditor(FaqBlockEditor),
  testimonials: asEditor(TestimonialsBlockEditor),
  features: asEditor(FeaturesBlockEditor),
  pricing: asEditor(PricingBlockEditor),
  team: asEditor(TeamBlockEditor),
  timeline: asEditor(TimelineBlockEditor),
  map: asEditor(MapBlockEditor),
  accordion: asEditor(AccordionBlockEditor),
  statistics: asEditor(StatisticsBlockEditor),
  contact_form: asEditor(ContactFormBlockEditor),
  cta: asEditor(CtaBlockEditor),
  spacer: asEditor(SpacerBlockEditor),
  divider: asEditor(DividerBlockEditor),
};

interface BlockEditorPanelProps {
  block: PageBlock;
  definition: BlockDefinition | undefined;
  onSave: (config: Record<string, unknown>) => void;
  isSaving: boolean;
}

/**
 * Dispatches to the right typed editor for `definition.key`. Local draft
 * state resets per-block via the parent remounting this with `key={block.id}`
 * (React's own recommended pattern, not an effect + setState).
 */
export function BlockEditorPanel({ block, definition, onSave, isSaving }: BlockEditorPanelProps) {
  const key = definition?.key ?? "";
  const [draft, setDraft] = useState<Record<string, unknown>>(() => ({
    ...(DEFAULT_CONFIGS[key] ?? {}),
    ...block.config,
  }));

  if (!definition) {
    return <p className="text-sm text-neutral-500">Loading block…</p>;
  }

  const Editor = BLOCK_EDITORS[key];

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-medium">{definition.label}</div>
      {Editor ? (
        <Editor config={draft} onChange={setDraft} />
      ) : (
        <p className="text-sm text-neutral-500">
          No editor registered for &quot;{definition.label}&quot; yet.
        </p>
      )}
      {Editor ? (
        <Button onClick={() => onSave(draft)} disabled={isSaving} className="self-start">
          {isSaving ? "Saving…" : "Save Block"}
        </Button>
      ) : null}
    </div>
  );
}
