"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePagePreview } from "@/hooks/usePages";
import type { PageType } from "@/types/page";
import type { CtaConfig, FaqConfig, HeroBannerConfig, ImageConfig, TextConfig } from "@/types/blockConfigs";

interface PreviewDialogProps {
  pageType: PageType;
  open: boolean;
  onClose: () => void;
}

/** Minimal draft render via `GET /pages/{type}/preview` — the public site renderer
 * doesn't exist yet (later phase), so this is a plain content preview, not final styling. */
export function PreviewDialog({ pageType, open, onClose }: PreviewDialogProps) {
  const { data: page, isLoading } = usePagePreview(pageType, open);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preview — {page?.title ?? "…"}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <div className="flex flex-col gap-6 py-2">
            {(page?.blocks ?? [])
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((block) => (
                <BlockPreview key={block.id} blockKey={block.block_definition_id} config={block.config} />
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BlockPreview({ config }: { blockKey: string; config: Record<string, unknown> }) {
  if ("items" in config) {
    const c = config as unknown as FaqConfig;
    return (
      <section className="flex flex-col gap-2">
        <h3 className="font-heading text-lg font-semibold">{c.heading}</h3>
        <div className="flex flex-col gap-3">
          {c.items.map((item, i) => (
            <div key={i}>
              <p className="text-sm font-medium">{item.q}</p>
              <p className="text-sm text-neutral-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if ("slides" in config) {
    const c = config as unknown as HeroBannerConfig;
    const first = c.slides[0];
    return (
      <section
        className="relative overflow-hidden rounded-lg border bg-neutral-50 bg-cover bg-center p-6 text-center"
        style={first?.image_url ? { backgroundImage: `url(${first.image_url})` } : undefined}
      >
        {first?.image_url ? <div className="absolute inset-0 bg-black/40" /> : null}
        <div className={first?.image_url ? "relative text-white" : undefined}>
          <h2 className="font-heading text-2xl font-bold">{first?.heading}</h2>
          <p className="mt-1 opacity-90">{first?.subheading}</p>
          {c.button_label ? (
            <span className="mt-3 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">
              {c.button_label}
            </span>
          ) : null}
        </div>
        {c.slides.length > 1 ? (
          <p className="relative mt-3 text-xs opacity-75">+{c.slides.length - 1} more slide(s)</p>
        ) : null}
      </section>
    );
  }

  if ("image_url" in config) {
    const c = config as unknown as ImageConfig;
    return (
      <figure className="flex flex-col gap-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.image_url} alt={c.alt_text} className="max-h-64 rounded-md object-cover" />
        {c.caption ? <figcaption className="text-xs text-neutral-500">{c.caption}</figcaption> : null}
      </figure>
    );
  }

  if ("button_href" in config) {
    const c = config as unknown as CtaConfig;
    return (
      <section className="rounded-lg border bg-neutral-900 p-6 text-center text-white">
        <h3 className="font-heading text-xl font-semibold">{c.heading}</h3>
        <p className="mt-1 text-neutral-300">{c.description}</p>
        <span className="mt-3 inline-block rounded-md bg-white px-4 py-2 text-sm text-neutral-900">
          {c.button_label}
        </span>
      </section>
    );
  }

  if ("body" in config) {
    const c = config as unknown as TextConfig;
    return (
      <section className="flex flex-col gap-1">
        {c.heading ? <h3 className="font-heading text-lg font-semibold">{c.heading}</h3> : null}
        <p className="whitespace-pre-wrap text-sm text-neutral-700">{c.body}</p>
      </section>
    );
  }

  return <p className="text-xs text-neutral-400">Block preview not available for this type yet.</p>;
}
