"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { GlobalSearchOverlay } from "@/components/layout/GlobalSearchOverlay";
import { useBootstrapSession } from "@/hooks/useAuth";
import { useSessionStore } from "@/store/session";

export function DashboardShell({ children }: { children: ReactNode }) {
  useBootstrapSession();
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isBootstrapping, isAuthenticated, router, pathname]);

  if (isBootstrapping) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Redirecting to login…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-[#f4f6f9] p-4 sm:p-6">{children}</main>
      </div>
      <GlobalSearchOverlay />
    </div>
  );
}

