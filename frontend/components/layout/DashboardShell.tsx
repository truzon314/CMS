"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { GlobalSearchOverlay } from "@/components/layout/GlobalSearchOverlay";
import { useBootstrapSession } from "@/hooks/useAuth";
import { useSessionStore } from "@/store/session";

export function DashboardShell({ children }: { children: ReactNode }) {
  useBootstrapSession();
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping);

  if (isBootstrapping) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-neutral-50 p-5">{children}</main>
      </div>
      <GlobalSearchOverlay />
    </div>
  );
}
