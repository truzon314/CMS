"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import { getAccessToken, tryRefresh } from "@/lib/api-client";
import { useSessionStore } from "@/store/session";

export function useLogin() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => {
      setSession(data.user, data.access_token);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearSession();
      router.push("/login");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
}

/**
 * Self-service, while already logged in — distinct from useResetPassword's
 * unauthenticated, emailed-token flow. The backend revokes every session on
 * success (same as reset_password), so the in-memory access token this tab
 * is holding is the last one still live; send it back to login immediately
 * rather than let it silently fail on the next refresh ~15 minutes later.
 */
export function useChangePassword() {
  const router = useRouter();
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Password changed — please log in again.");
      clearSession();
      router.push("/login");
    },
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success("Password updated — please log in.");
      router.push("/login");
    },
  });
}

/**
 * Runs once on app load: the access token only lives in memory, so a page
 * refresh needs to silently re-establish the session from the httpOnly
 * refresh cookie before anything renders as "logged out". Skips the network
 * round-trip entirely if a session is already live (e.g. just logged in via
 * `useLogin`) — calling this unconditionally on every mount used to fire a
 * *raw*, unguarded `/auth/refresh` request that bypassed api-client's
 * single-flight + cross-tab lock, which could race the token rotation and
 * trip the backend's reuse-detection (revoking every session). Routing
 * through `tryRefresh()` here closes that gap — it's the same chokepoint
 * every other 401-triggered refresh in the app already goes through.
 */
export function useBootstrapSession() {
  const ranOnce = useRef(false);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const setSession = useSessionStore((s) => s.setSession);
  const finishBootstrap = useSessionStore((s) => s.finishBootstrap);

  useEffect(() => {
    if (ranOnce.current || isAuthenticated) {
      if (isAuthenticated) finishBootstrap();
      return;
    }
    ranOnce.current = true;

    (async () => {
      const refreshed = await tryRefresh();
      if (!refreshed) {
        // The refresh cookie is present but genuinely dead (expired, or
        // caught by the backend's rotation-reuse detection racing itself
        // — e.g. two refresh attempts firing close together on reload,
        // which trips "already-used token" and revokes both). proxy.ts's
        // edge check only looks at whether the cookie exists, not whether
        // it's valid, and redirects /login back to /dashboard whenever it
        // does — so leaving a dead cookie in place here means the next
        // redirect to /login just bounces straight back, forever: the
        // client says "not authenticated, go to /login", the edge says
        // "you have a cookie, go to /dashboard", neither side ever wins.
        // Clearing it server-side (logout already does exactly this,
        // unconditionally, regardless of whether the token it's given is
        // still valid) breaks that loop before it can start.
        authService.logout().catch(() => {});
        finishBootstrap();
        return;
      }
      try {
        const user = await authService.me();
        setSession(user, getAccessToken() ?? "");
      } catch {
        authService.logout().catch(() => {});
        finishBootstrap();
      }
    })();
  }, [isAuthenticated, setSession, finishBootstrap]);
}
