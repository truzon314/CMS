"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useGlobalSearch } from "@/hooks/useSearch";
import { useSearchOverlayStore } from "@/store/searchOverlay";

const TYPE_LABELS: Record<string, string> = {
  page: "Page",
  blog_post: "Blog post",
  property: "Property",
  media: "Media",
  user: "User",
};

/** ⌘K / Ctrl+K global search overlay (ROADMAP.md Phase 6) — mounted once in
 * DashboardShell so it's reachable from every admin screen. */
export function GlobalSearchOverlay() {
  const open = useSearchOverlayStore((s) => s.open);
  const setOpen = useSearchOverlayStore((s) => s.setOpen);
  const toggle = useSearchOverlayStore((s) => s.toggle);
  const [query, setQuery] = useState("");
  const { data, isFetching } = useGlobalSearch(query);
  const results = data ?? [];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) setQuery("");
    },
    [setOpen]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[20%] max-w-lg translate-y-0 p-0 sm:max-w-lg" showCloseButton={false}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Search size={16} className="shrink-0 text-neutral-400" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, blog, properties, media, users…"
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="max-h-80 overflow-y-auto p-1.5">
          {query.trim().length < 2 ? (
            <p className="px-2 py-6 text-center text-xs text-neutral-400">Type at least 2 characters to search.</p>
          ) : isFetching ? (
            <p className="px-2 py-6 text-center text-xs text-neutral-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-neutral-400">No results for &quot;{query}&quot;.</p>
          ) : (
            results.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                href={r.link}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm hover:bg-neutral-100"
              >
                <span className="truncate">{r.title}</span>
                <span className="shrink-0 text-xs text-neutral-400">{r.subtitle ?? TYPE_LABELS[r.type] ?? r.type}</span>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
