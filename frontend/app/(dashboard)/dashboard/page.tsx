"use client";

import Link from "next/link";
import { useSessionStore } from "@/store/session";
import { useDashboardStats } from "@/hooks/useDashboard";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user);
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold">Welcome{user ? `, ${user.full_name}` : ""}</h1>
        <p className="text-sm text-neutral-500">Here&apos;s what&apos;s happening across Truzon CMS right now.</p>
      </div>

      {isLoading || !stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-lg border bg-white shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Total Users" value={stats.total_users} />
          <StatTile label="Published Pages" value={stats.published_pages} />
          <StatTile label="Draft Pages" value={stats.draft_pages} />
          <StatTile label="Blog Posts" value={`${stats.published_blog_posts}/${stats.total_blog_posts}`} />
          <StatTile label="Storage Used" value={formatBytes(stats.storage_bytes)} />
          <StatTile label="Pending Reviews" value={stats.pending_reviews} />
        </div>
      )}

      {stats ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium">Recent Activity</div>
            {stats.recent_activity.length === 0 ? (
              <p className="text-xs text-neutral-400">Nothing yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {stats.recent_activity.map((a) => (
                  <li key={a.id} className="text-xs">
                    <span className="font-medium">{a.user_name}</span>{" "}
                    <span className="text-neutral-500">{a.action}</span>
                    <div className="text-[11px] text-neutral-400">{new Date(a.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/audit-logs" className="mt-3 inline-block text-xs font-medium text-neutral-600 hover:underline">
              View all →
            </Link>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium">Recent Logins</div>
            {stats.recent_logins.length === 0 ? (
              <p className="text-xs text-neutral-400">Nothing yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {stats.recent_logins.map((u) => (
                  <li key={u.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{u.full_name}</span>
                    <span className="text-neutral-400">{new Date(u.last_login_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium">Latest Uploaded Files</div>
            {stats.latest_uploads.length === 0 ? (
              <p className="text-xs text-neutral-400">Nothing yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {stats.latest_uploads.map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium">{m.file_name}</span>
                    <span className="shrink-0 text-neutral-400">{new Date(m.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/media" className="mt-3 inline-block text-xs font-medium text-neutral-600 hover:underline">
              View all →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
