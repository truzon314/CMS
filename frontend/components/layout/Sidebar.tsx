"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  FileText,
  Globe,
  History,
  Images,
  Inbox,
  LayoutDashboard,
  MapPin,
  Menu as MenuIcon,
  MessageSquare,
  Newspaper,
  Quote,
  Settings as SettingsIcon,
  Shield,
  Tag,
  Trash2,
  Users,
  Search,
  LogOut,
  ChevronDown,
  PanelLeftClose,
} from "lucide-react";
import { useSessionStore } from "@/store/session";
import { useSidebarStore } from "@/store/sidebarStore";
import { useLogout } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  section: "CMS" | "OPERATIONS" | "SYSTEM";
  permission?: string | string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "CMS" },
  { label: "Pages", href: "/pages", icon: FileText, section: "CMS", permission: "pages.view" },
  { label: "Blog Posts", href: "/blog", icon: Newspaper, section: "CMS", permission: "blog.view" },
  { label: "Projects", href: "/properties", icon: Building2, section: "CMS", permission: "properties.view" },
  { label: "Map Management", href: "/map-management", icon: MapPin, section: "CMS" },
  { label: "Categories", href: "/categories", icon: Tag, section: "CMS", permission: ["blog.edit", "properties.edit"] },
  { label: "Tags", href: "/tags", icon: Tag, section: "CMS", permission: "blog.edit" },
  { label: "Media Library", href: "/media", icon: Images, section: "CMS", permission: "media.view" },
  { label: "Careers", href: "/careers", icon: Briefcase, section: "CMS", permission: "careers.view" },
  { label: "Gallery", href: "/gallery", icon: Images, section: "CMS", permission: "gallery.view" },
  { label: "Testimonials", href: "/testimonials", icon: Quote, section: "CMS", permission: "testimonials.view" },
  { label: "SEO Module", href: "/seo", icon: Globe, section: "CMS", permission: "pages.view" },
  { label: "Menus", href: "/menus", icon: MenuIcon, section: "CMS", permission: "settings.manage" },
  { label: "Form Submissions", href: "/forms", icon: Inbox, section: "OPERATIONS", permission: "forms.view" },
  { label: "CRM", href: "/crm", icon: MessageSquare, section: "OPERATIONS", permission: "crm.view" },
  { label: "Users", href: "/users", icon: Users, section: "OPERATIONS", permission: "users.view" },
  { label: "Roles", href: "/roles", icon: Shield, section: "OPERATIONS", permission: "users.manage" },
  { label: "Trash", href: "/trash", icon: Trash2, section: "SYSTEM", permission: "trash.manage" },
  { label: "Audit Logs", href: "/audit-logs", icon: History, section: "SYSTEM", permission: "audit.view" },
  { label: "Settings", href: "/settings", icon: SettingsIcon, section: "SYSTEM", permission: "settings.manage" },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const hasPermission = useSessionStore((s) => s.hasPermission);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const closeMobile = useSidebarStore((s) => s.closeMobile);
  const logout = useLogout();

  // The CMS/OPERATIONS section chevrons were purely decorative — no click
  // handler, nothing to toggle. This makes them real collapse/expand
  // controls for their section's nav items.
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  function toggleSection(section: string) {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  // Below lg: this is an off-canvas overlay — close it on navigation and Escape.
  useEffect(() => {
    closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobile();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeMobile]);

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    const keys = Array.isArray(item.permission) ? item.permission : [item.permission];
    return keys.some((key) => hasPermission(key));
  });

  const cmsItems = visibleItems.filter((i) => i.section === "CMS");
  const opsItems = visibleItems.filter((i) => i.section === "OPERATIONS");
  const systemItems = visibleItems.filter((i) => i.section === "SYSTEM");

  // "Hide" always means hide, on whichever axis is currently visible — safe
  // to set both unconditionally since only one is ever visually active.
  function hideSidebar() {
    setCollapsed(true);
    closeMobile();
  }

  return (
    <>
      {mobileOpen && (
        <div
          aria-hidden
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[280px] shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-800 bg-[#0b132b] text-slate-300 shadow-2xl transition-transform duration-300 select-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:sticky lg:top-0 lg:z-30 lg:w-[230px] lg:translate-x-0 lg:shadow-none",
          collapsed && "lg:hidden"
        )}
      >
        <div className="flex flex-col gap-4 p-4">
          {/* Logo, Brand Header & Hide Button */}
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-sm">
                ///
              </div>
              <span className="font-extrabold text-base tracking-wider text-white">
                TRUZON
              </span>
              <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                PRO
              </span>
            </div>

            {/* Hide Sidebar Button */}
            <button
              type="button"
              onClick={hideSidebar}
              aria-label="Hide sidebar"
              className="flex h-11 w-11 items-center justify-center rounded text-slate-400 transition-colors hover:text-white lg:h-auto lg:w-auto lg:p-1"
              title="Hide Sidebar"
            >
              <PanelLeftClose size={17} />
            </button>
          </div>

        {/* Sidebar Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search modules..."
            className="w-full rounded-lg bg-[#1a233a] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-5 mt-2">
          {/* CMS Section */}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => toggleSection("CMS")}
              aria-expanded={!collapsedSections.CMS}
              className="flex w-full items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-amber-500/90 cursor-pointer hover:text-amber-400"
            >
              <span>CMS</span>
              <ChevronDown
                size={12}
                className={cn("transition-transform", collapsedSections.CMS && "-rotate-90")}
              />
            </button>
            {!collapsedSections.CMS &&
              cmsItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-[#1a233a] hover:text-white",
                      active && "bg-[#1a233a] font-semibold text-white border-l-2 border-amber-500 pl-2.5 shadow-sm"
                    )}
                  >
                    <Icon size={15} className={cn("text-slate-400", active && "text-amber-400")} />
                    {item.label}
                  </Link>
                );
              })}
          </div>

          {/* OPERATIONS Section */}
          {opsItems.length > 0 && (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => toggleSection("OPERATIONS")}
                aria-expanded={!collapsedSections.OPERATIONS}
                className="flex w-full items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-amber-500/90 cursor-pointer hover:text-amber-400"
              >
                <span>OPERATIONS</span>
                <ChevronDown
                  size={12}
                  className={cn("transition-transform", collapsedSections.OPERATIONS && "-rotate-90")}
                />
              </button>
              {!collapsedSections.OPERATIONS &&
                opsItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-[#1a233a] hover:text-white",
                      active && "bg-[#1a233a] font-semibold text-white border-l-2 border-amber-500 pl-2.5 shadow-sm"
                    )}
                  >
                    <Icon size={15} className={cn("text-slate-400", active && "text-amber-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* SYSTEM Section */}
          {systemItems.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>SYSTEM</span>
              </div>
              {systemItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-[#1a233a] hover:text-white",
                      active && "bg-[#1a233a] font-semibold text-white border-l-2 border-amber-500 pl-2.5 shadow-sm"
                    )}
                  >
                    <Icon size={15} className={cn("text-slate-400", active && "text-amber-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* User Profile Card Footer */}
      <div className="border-t border-slate-800 p-3 bg-[#080d1e] flex items-center justify-between sticky bottom-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-700 text-xs font-bold text-white shadow-sm">
            SA
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold text-white truncate max-w-[110px]">
              {user?.full_name ?? "Super Admin"}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
              Full System Access
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout.mutate()}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
      </aside>
    </>
  );
}
