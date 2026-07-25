"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMenusList } from "@/hooks/useMenus";

export function MenusListPage() {
  const { data: menus, isLoading } = useMenusList();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Menus</h1>
      <p className="text-sm text-neutral-500">
        Fixed set of 5 nav menus — no create/delete, just reordering/editing each one&rsquo;s items.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border bg-neutral-100" />
            ))
          : (menus ?? []).map((menu) => (
              <Link
                key={menu.id}
                href={`/menus/${menu.key}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-white p-5 shadow-sm transition-colors hover:border-neutral-400"
              >
                <span className="font-medium">{menu.label}</span>
                <ArrowRight size={14} className="text-neutral-400" />
              </Link>
            ))}
      </div>
    </div>
  );
}
