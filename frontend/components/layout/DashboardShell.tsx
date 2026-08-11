"use client";

import { useEffect, useRef, type ReactNode } from "react";
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
  // Guards against firing the redirect twice (React Strict Mode double-
  // invokes effects in dev, and this one's deps can also genuinely change
  // twice in quick succession) — two overlapping router.push() calls can
  // race each other and leave the navigation stuck rendering neither the
  // old page nor /login, which is exactly the "Redirecting to login…"
  // hang this was causing. Resets once authenticated again so a later
  // logout can still redirect.
  const redirectStarted = useRef(false);
  // Always holds the latest isAuthenticated, for the fallback timeout below
  // to check against at fire time — not the value it closed over when
  // scheduled, which could be stale by then (e.g. the user logged back in
  // during the 1.5s window). Updated in its own effect, not during render
  // (mutating a ref during render is itself a React footgun).
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    if (isBootstrapping) return;
    if (isAuthenticated) {
      redirectStarted.current = false;
      return;
    }
    if (redirectStarted.current) return;
    redirectStarted.current = true;
    const target = `/login?redirect=${encodeURIComponent(pathname)}`;
    // replace, not push — the protected URL was never actually reachable,
    // so it shouldn't leave a dead entry in browser history either.
    router.replace(target);
    // Belt-and-suspenders: if the client-side navigation hasn't actually
    // landed on /login shortly after (a swallowed router error, a stuck
    // in-flight transition, or anything else that leaves this component
    // rendered with nowhere to go), force a real page load instead of
    // leaving the visitor stuck on "Redirecting to login…" forever with
    // no way out but a manual refresh. The specific bug that used to make
    // this loop indefinitely (a stale refresh cookie proxy.ts kept
    // treating as "logged in" while the client correctly knew otherwise,
    // each side bouncing the other's redirect) is fixed at its source in
    // useBootstrapSession — this is just a single safety net for whatever
    // else might strand someone here.
    window.setTimeout(() => {
      if (isAuthenticatedRef.current) return; // logged back in before this fired — leave them alone
      if (!window.location.pathname.startsWith("/login")) window.location.href = target;
    }, 2000);
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

