"use client";

import { useEffect, useState, useMemo } from "react";

export type CommandItem = {
  id: string;
  title: string;
  category: "Projects" | "Layers" | "Actions" | "Providers";
  subtitle?: string;
  onSelect: () => void;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
};

export default function CommandPaletteModal({ isOpen, onClose, items }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)),
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev + 1) % Math.max(1, filteredItems.length),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) =>
          (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length),
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        selected.onSelect();
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-2xl">
        <div className="flex items-center border-b border-zinc-200 px-4 py-3">
          <span className="text-zinc-400 mr-2 text-sm">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInInput}
            placeholder="Search projects, layers, providers, or type a command... (Esc to cancel)"
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder-zinc-400"
          />
          <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400">
              No matching commands or projects found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.onSelect();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          isSelected
                            ? "bg-blue-700 text-white"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {item.category}
                      </span>
                      <span className="truncate font-medium">{item.title}</span>
                    </div>
                    {item.subtitle && (
                      <span
                        className={`text-[11px] truncate ml-2 ${
                          isSelected ? "text-blue-100" : "text-zinc-400"
                        }`}
                      >
                        {item.subtitle}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-4 py-2 text-[11px] text-zinc-400">
          <span>
            Use <kbd className="font-semibold">↑</kbd>{" "}
            <kbd className="font-semibold">↓</kbd> to navigate,{""}
            <kbd className="font-semibold">↵</kbd> to select
          </span>
          <span>Press ⌘K / Ctrl+K anytime</span>
        </div>
      </div>
    </div>
  );
}
