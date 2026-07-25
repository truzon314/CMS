"use client";

interface SerpPreviewProps {
  title: string;
  description: string;
  url: string;
}

export function SerpPreview({ title, description, url }: SerpPreviewProps) {
  const displayTitle = title || "Page Title — Truzon Homes";
  const displayUrl = url || "https://truzonhomes.com/sample-page";
  const displayDesc =
    description ||
    "Add a meta description to see how your page will look in Google search results. A compelling description improves click-through rates.";

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        Google Search Preview
      </div>
      <div className="flex flex-col gap-1 font-sans">
        <div className="flex items-center gap-1.5 text-xs text-[#202124] truncate">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-600">
            T
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12px] font-normal text-[#202124]">Truzon Homes</span>
            <span className="text-[11px] text-[#5f6368] truncate">{displayUrl}</span>
          </div>
        </div>
        <h3 className="text-[18px] font-normal text-[#1a0dab] hover:underline leading-snug truncate cursor-pointer">
          {displayTitle}
        </h3>
        <p className="text-[13px] text-[#4d5156] leading-relaxed line-clamp-2">
          {displayDesc}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 border-t pt-2">
        <span>Title length: <strong className={title.length > 60 ? "text-amber-600" : "text-emerald-600"}>{title.length}</strong> / 60 chars</span>
        <span>Desc length: <strong className={description.length > 160 ? "text-amber-600" : "text-emerald-600"}>{description.length}</strong> / 160 chars</span>
      </div>
    </div>
  );
}
