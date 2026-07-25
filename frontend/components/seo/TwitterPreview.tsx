"use client";

interface TwitterPreviewProps {
  title: string;
  description: string;
  cardType?: "summary" | "summary_large_image" | string | null;
  imageUrl?: string | null;
  siteUrl?: string;
}

export function TwitterPreview({ title, description, cardType = "summary_large_image", imageUrl, siteUrl }: TwitterPreviewProps) {
  const displayTitle = title || "Page Title — Truzon Homes";
  const displayDesc = description || "Discover architectural masterpieces and premium investment opportunities.";
  const displayDomain = siteUrl ? new URL(siteUrl, "https://truzonhomes.com").hostname : "truzonhomes.com";

  const isLarge = cardType === "summary_large_image";

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden max-w-md">
      <div className="p-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 border-b">
        Twitter / X Card Preview ({isLarge ? "Summary Large Image" : "Summary Card"})
      </div>
      {isLarge ? (
        <div className="flex flex-col">
          <div className="relative aspect-[1.91/1] w-full bg-neutral-100 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Twitter Card Preview" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-neutral-400 font-medium">No Card Image Selected</span>
            )}
          </div>
          <div className="p-3 bg-white border-t">
            <div className="text-[12px] text-neutral-500 font-normal truncate">{displayDomain}</div>
            <div className="font-bold text-[14px] text-neutral-900 leading-snug truncate mt-0.5">{displayTitle}</div>
            <div className="text-[13px] text-neutral-600 line-clamp-2 mt-0.5">{displayDesc}</div>
          </div>
        </div>
      ) : (
        <div className="flex p-3 gap-3 bg-white items-center">
          <div className="h-20 w-20 shrink-0 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center border">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Twitter Thumbnail" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] text-neutral-400">Thumb</span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] text-neutral-500">{displayDomain}</span>
            <span className="font-bold text-[13px] text-neutral-900 truncate leading-tight mt-0.5">{displayTitle}</span>
            <span className="text-[12px] text-neutral-600 line-clamp-2 mt-0.5">{displayDesc}</span>
          </div>
        </div>
      )}
    </div>
  );
}
