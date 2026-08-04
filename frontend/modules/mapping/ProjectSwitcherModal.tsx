"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";

type Project = {
  id: string;
  name: string;
  mapProviderType?: string;
};

type Props = {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  pinnedIds: string[];
  recentIds: string[];
  onTogglePin: (id: string) => void;
  onOpenCommandPalette: () => void;
  onDeleteProject?: (id: string) => void;
};

export default function ProjectSwitcherModal({
  projects,
  selectedProjectId,
  onSelectProject,
  pinnedIds,
  recentIds,
  onTogglePin,
  onOpenCommandPalette,
  onDeleteProject,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pinned" | "recent">(
    "all",
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (activeTab === "pinned") {
      list = list.filter((p) => pinnedIds.includes(p.id));
    } else if (activeTab === "recent") {
      list = list.filter((p) => recentIds.includes(p.id));
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    );
  }, [projects, activeTab, pinnedIds, recentIds, search]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 shadow transition-colors hover:bg-zinc-50"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-zinc-900 max-w-[160px] truncate">
          {selectedProject ? selectedProject.name : "Select Project"}
        </span>
        <span className="text-xs text-zinc-400">({projects.length})</span>
        <span className="text-[10px] text-zinc-400">▼</span>
      </button>

      {/* Switcher Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-2xl z-50">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-100">
            <h4 className="text-xs font-bold text-zinc-900">
              Project Workspace
            </h4>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCommandPalette();
              }}
              className="text-[10px] text-blue-600 font-semibold hover:underline"
            >
              ⌘K Quick Search
            </button>
          </div>

          {/* Search Bar */}
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Filter ${projects.length} projects...`}
            className="w-full rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs outline-none mb-2"
          />

          {/* Filter Tabs */}
          <div className="flex gap-1 mb-2 border-b border-zinc-100 pb-1.5 text-[11px]">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2 py-0.5 rounded font-medium ${
                activeTab === "all"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab("pinned")}
              className={`px-2 py-0.5 rounded font-medium ${
                activeTab === "pinned"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              ⭐ Pinned ({pinnedIds.length})
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-2 py-0.5 rounded font-medium ${
                activeTab === "recent"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              🕒 Recent ({recentIds.length})
            </button>
          </div>

          {/* Project List */}
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredProjects.length === 0 ? (
              <p className="p-4 text-center text-xs text-zinc-400">
                No matching projects found.
              </p>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = p.id === selectedProjectId;
                const isPinned = pinnedIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelectProject(p.id);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left truncate mr-2"
                    >
                      {p.name}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(p.id);
                        }}
                        className={`text-xs p-1 rounded hover:bg-zinc-200 ${
                          isPinned
                            ? "text-amber-500"
                            : "text-zinc-300 hover:text-amber-500"
                        }`}
                        title={isPinned ? "Unpin project" : "Pin project"}
                      >
                        ★
                      </button>
                      {onDeleteProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `Are you sure you want to delete project"${p.name}"?`,
                              )
                            ) {
                              onDeleteProject(p.id);
                            }
                          }}
                          className="text-xs p-1 rounded text-zinc-400 hover:bg-zinc-200 hover:text-red-500 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
