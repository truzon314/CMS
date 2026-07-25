"use client";

import { Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useSessionStore } from "@/store/session";
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
  const logout = useLogout();

  return (
    <header className="flex items-center justify-between border-b bg-white px-5 py-3">
      <button
        type="button"
        onClick={() => openSearch(true)}
        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
      >
        <Search size={14} />
        Search…
        <kbd className="ml-2 rounded border bg-neutral-50 px-1.5 py-0.5 text-[10px] text-neutral-400">⌘K</kbd>
      </button>

      <div className="flex items-center gap-3">
        {user ? <NotificationBell /> : null}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm">
                <div className="font-medium">{user.full_name}</div>
                <div className="text-neutral-500">{user.email}</div>
              </div>
              <DropdownMenuItem onClick={() => logout.mutate()}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
