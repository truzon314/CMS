"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { usePagesList } from "@/hooks/usePages";

export function PagesListPage() {
  const { data: pages, isLoading } = usePagesList();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Pages</h1>
      <p className="text-sm text-neutral-500">
        Exactly 5 fixed pages — no create/delete here (ERD.md). Each is built from an ordered
        list of blocks.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg border bg-neutral-100" />
            ))
          : (pages ?? []).map((page) => (
              <Link
                key={page.id}
                href={`/pages/${page.page_type}`}
                className="flex flex-col gap-3 rounded-lg border bg-white p-5 shadow-sm transition-colors hover:border-neutral-400"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{page.title}</span>
                  <StatusPill status={page.status} />
                </div>
                <div className="text-xs text-neutral-500">
                  Updated {new Date(page.updated_at).toLocaleString()}
                </div>
                <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  Edit blocks <ArrowRight size={14} />
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
