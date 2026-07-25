"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  History,
  Images,
  Inbox,
  LayoutDashboard,
  Menu as MenuIcon,
  Newspaper,
  Settings as SettingsIcon,
  Shield,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { useSessionStore } from "@/store/session";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  permission?: string | string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pages", href: "/pages", icon: FileText, permission: "pages.view" },
  { label: "Blog", href: "/blog", icon: Newspaper, permission: "blog.view" },
  { label: "Properties", href: "/properties", icon: Building2, permission: "properties.view" },
  { label: "Categories", href: "/categories", icon: Tag, permission: ["blog.edit", "properties.edit"] },
  { label: "Tags", href: "/tags", icon: Tag, permission: "blog.edit" },
  { label: "Media", href: "/media", icon: Images, permission: "media.view" },
  { label: "Menus", href: "/menus", icon: MenuIcon, permission: "settings.manage" },
  { label: "Form Submissions", href: "/forms", icon: Inbox, permission: "forms.view" },
  { label: "Users", href: "/users", icon: Users, permission: "users.view" },
  { label: "Roles", href: "/roles", icon: Shield, permission: "users.manage" },
  { label: "Trash", href: "/trash", icon: Trash2, permission: "trash.manage" },
  { label: "Audit Logs", href: "/audit-logs", icon: History, permission: "audit.view" },
  { label: "Settings", href: "/settings", icon: SettingsIcon, permission: "settings.manage" },
];

export function Sidebar() {
  const pathname = usePathname();
  const hasPermission = useSessionStore((s) => s.hasPermission);

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    const keys = Array.isArray(item.permission) ? item.permission : [item.permission];
    return keys.some((key) => hasPermission(key));
  });

  return (
    <aside className="w-[190px] shrink-0 border-r bg-white p-3">
      <div className="mb-4 px-2 py-1 text-sm font-semibold">Truzon CMS</div>
      <nav className="flex flex-col gap-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-neutral-600 hover:bg-neutral-100",
                active && "bg-neutral-100 font-medium text-neutral-900"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
