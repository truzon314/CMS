"use client";

import { useCallback, useState } from "react";

const PINNED_STORAGE_KEY = "map_system_pinned_projects";
const RECENT_STORAGE_KEY = "map_system_recent_projects";

export function useWorkspaceState() {
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedPinned = localStorage.getItem(PINNED_STORAGE_KEY);
      return savedPinned ? JSON.parse(savedPinned) : [];
    } catch {
      return [];
    }
  });
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedRecent = localStorage.getItem(RECENT_STORAGE_KEY);
      return savedRecent ? JSON.parse(savedRecent) : [];
    } catch {
      return [];
    }
  });

  // useCallback with empty deps: both only use their own setState updater
  // (already stable), so they can stay referentially stable across
  // renders — callers that memoize on these (e.g. MapView's command
  // palette item list) depend on that.
  const togglePin = useCallback((id: string) => {
    setPinnedIds((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const addRecent = useCallback((id: string) => {
    setRecentIds((current) => {
      const filtered = current.filter((x) => x !== id);
      const next = [id, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return {
    pinnedIds,
    recentIds,
    togglePin,
    addRecent,
    isPinned: (id: string) => pinnedIds.includes(id),
  };
}
