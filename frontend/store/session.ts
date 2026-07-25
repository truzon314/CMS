import { create } from "zustand";
import { setAccessToken } from "@/lib/api-client";
import type { User } from "@/types/auth";

interface SessionState {
  user: User | null;
  isAuthenticated: boolean;
  /** Set once on app boot while /auth/refresh + /auth/me are checked, to avoid a login flash. */
  isBootstrapping: boolean;
  setSession: (user: User, accessToken: string) => void;
  clearSession: () => void;
  finishBootstrap: () => void;
  hasPermission: (key: string) => boolean;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  setSession: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true, isBootstrapping: false });
  },
  clearSession: () => {
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isBootstrapping: false });
  },
  finishBootstrap: () => set({ isBootstrapping: false }),
  hasPermission: (key) => {
    const user = get().user;
    return !!user?.role.permissions.some((p) => p.key === key);
  },
}));
