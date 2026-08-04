"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const { data: unread } = useUnreadNotificationCount();
  const { data } = useNotificationsList({ perPage: 8 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];
  const count = unread?.count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 outline-none hover:bg-neutral-100"
      >
        <Bell size={17} />
        {count > 0 ? (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-medium">Notifications</span>
          {count > 0 ? (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={() => markAllRead.mutate()}>
              Mark all read
            </Button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-neutral-500">You&apos;re all caught up.</div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn("flex flex-col items-start gap-0.5 whitespace-normal py-2", !n.is_read && "bg-neutral-50")}
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id);
              }}
              render={n.link ? <Link href={n.link} /> : undefined}
            >
              <span className="text-sm font-medium">{n.title}</span>
              {n.message ? <span className="text-xs text-neutral-500">{n.message}</span> : null}
              <span className="text-[11px] text-neutral-400">{timeAgo(n.created_at)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
