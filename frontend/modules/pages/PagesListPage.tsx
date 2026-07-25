"use client";

import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { usePagesList } from "@/hooks/usePages";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 14) return "1 week ago";
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 60) return "1 month ago";
  return `${Math.floor(diffInDays / 30)} months ago`;
}

export function PagesListPage() {
  const { data: pages, isLoading, isError, error } = usePagesList();

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Main Content Card Container */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        {isError ? (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold">Failed to load pages</p>
              <p className="text-xs text-red-600">
                {error instanceof Error ? error.message : "Authentication required or server unreachable."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pl-2">PAGE</th>
                  <th className="pb-3 text-center">STATUS</th>
                  <th className="pb-3 text-center">LAST UPDATED</th>
                  <th className="pb-3 pr-2 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 pl-2">
                          <div className="h-4 w-32 rounded bg-slate-100" />
                        </td>
                        <td className="py-4 text-center">
                          <div className="mx-auto h-6 w-20 rounded-full bg-slate-100" />
                        </td>
                        <td className="py-4 text-center">
                          <div className="mx-auto h-4 w-24 rounded bg-slate-100" />
                        </td>
                        <td className="py-4 pr-2 text-right">
                          <div className="ml-auto h-4 w-12 rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  : (pages ?? []).map((page) => (
                      <tr key={page.id} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 pl-2 font-bold text-slate-900 text-sm">
                          {page.title}
                        </td>
                        <td className="py-4 text-center">
                          <StatusPill status={page.status} />
                        </td>
                        <td className="py-4 text-center text-xs font-medium text-slate-400">
                          {formatRelativeTime(page.updated_at)}
                        </td>
                        <td className="py-4 pr-2 text-right">
                          <Link
                            href={`/pages/${page.page_type}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-amber-600 transition-colors"
                          >
                            Edit <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
