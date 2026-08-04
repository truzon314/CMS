"use client";

import { Search, ChevronDown, Grid, Menu, PanelLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useSessionStore } from "@/store/session";
import { useSidebarStore } from "@/store/sidebarStore";
import { useSearchOverlayStore } from "@/store/searchOverlay";
import { useLogout } from "@/hooks/useAuth";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar() {
  const user = useSessionStore((s) => s.user);
  const openSearch = useSearchOverlayStore((s) => s.setOpen);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const toggleMobile = useSidebarStore((s) => s.toggleMobile);
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 shadow-2xs select-none sm:px-6">
      {/* Sidebar Toggle Button, Title & Domain Subtext */}
      <div className="flex items-center gap-3">
        {/* Mobile-only: opens the off-canvas sidebar overlay */}
        <button
          type="button"
          onClick={toggleMobile}
          aria-label="Open sidebar"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Desktop-only: toggles the always-visible sidebar column */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`hidden items-center justify-center rounded-lg border p-1.5 transition-colors lg:flex ${
            collapsed
              ? "bg-amber-500 text-white border-amber-600 shadow-xs"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
          }`}
          title={collapsed ? "Show Sidebar" : "Hide Sidebar"}
        >
          <PanelLeft size={18} />
        </button>

        <div className="flex flex-col leading-tight">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight sm:text-lg">Website CMS</h2>
          <span className="hidden text-xs font-medium text-slate-400 sm:block">truzonhomes.com</span>
        </div>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-3">
        {/* Module Selector Pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 cursor-pointer transition-colors">
          <Grid size={14} className="text-slate-500" />
          <span>All Modules</span>
          <ChevronDown size={14} className="text-slate-400 ml-1" />
        </div>

        {/* Global Search Bar — icon-only below md:, full pill from md: up */}
        <button
          type="button"
          onClick={() => openSearch(true)}
          aria-label="Search"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50/80 text-xs text-slate-500 shadow-2xs transition-all hover:border-slate-300 hover:text-slate-700 md:h-auto md:w-64 md:justify-between md:gap-2 md:px-3.5 md:py-1.5 lg:w-80"
        >
          <Search size={18} className="shrink-0 text-slate-400 md:hidden" />
          <div className="hidden items-center gap-2 truncate md:flex">
            <Search size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">Search leads, bookings, projects...</span>
          </div>
          <kbd className="hidden shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 md:block">
            ⌘K
          </kbd>
        </button>

        {/* Notifications & Avatar */}
        {user ? <NotificationBell /> : null}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
              <Avatar className="h-8 w-8 border border-slate-200 shadow-2xs cursor-pointer hover:opacity-90">
                <AvatarFallback className="bg-[#0b132b] text-white text-xs font-bold">
                  {initials(user.full_name)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2 text-xs border-b">
                <div className="font-bold text-slate-900">{user.full_name}</div>
                <div className="text-slate-500 truncate">{user.email}</div>
              </div>
              <DropdownMenuItem onClick={() => logout.mutate()} className="text-xs cursor-pointer text-red-600 font-medium">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
