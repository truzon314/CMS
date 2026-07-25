"use client";

interface FacebookPreviewProps {
  title: string;
  description: string;
  imageUrl?: string | null;
  siteUrl?: string;
}

export function FacebookPreview({ title, description, imageUrl, siteUrl }: FacebookPreviewProps) {
  const displayTitle = title || "Page Title — Truzon Homes";
  const displayDesc = description || "Discover architectural masterpieces and premium investment opportunities.";
  const displayDomain = siteUrl ? new URL(siteUrl, "https://truzonhomes.com").hostname.toUpperCase() : "TRUZONHOMES.COM";

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden max-w-md">
      <div className="p-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 border-b">
        Facebook Open Graph Preview
      </div>
      <div className="relative aspect-[1.91/1] w-full bg-neutral-100 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Open Graph Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-400 p-4 text-center">
            <span className="text-xs font-medium">No Open Graph Image Selected</span>
            <span className="text-[11px] text-neutral-400">1200 x 630 px recommended</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-[#f2f3f5] border-t">
        <div className="text-[11px] text-[#606770] uppercase tracking-wide truncate">{displayDomain}</div>
        <div className="font-semibold text-[14px] text-[#1d2129] leading-tight truncate mt-0.5">{displayTitle}</div>
        <div className="text-[12px] text-[#606770] line-clamp-2 mt-1">{displayDesc}</div>
      </div>
    </div>
  );
}
