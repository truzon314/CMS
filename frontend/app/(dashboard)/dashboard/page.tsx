"use client";

import Link from "next/link";
import {
  Users,
  FileText,
  Newspaper,
  HardDrive,
  Clock,
  ArrowRight,
  Building2,
  Globe,
  PlusCircle,
  ShieldCheck,
  Activity,
  FileCode,
} from "lucide-react";
import { useSessionStore } from "@/store/session";
import { useDashboardStats } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/button";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user);
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Executive Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b132b] via-[#1a2540] to-[#0f172a] p-7 text-white shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                SYSTEM DASHBOARD
              </span>
              <span className="text-slate-400 text-xs">• Real Estate CMS</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Welcome back{user ? `, ${user.full_name}` : ""}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
              Truzon CMS is operating cleanly. Manage your properties, website content, SEO rank, and form submissions from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href="/pages">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none">
                <FileText size={15} className="mr-1.5" /> Pages List
              </Button>
            </Link>
            <Link href="/seo">
              <Button size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold">
                <Globe size={15} className="mr-1.5 text-amber-400" /> SEO Module
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Stat Grid */}
      {isLoading || !stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-white shadow-xs" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Users</span>
              <Users size={16} className="text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{stats.total_users}</div>
            <span className="text-[10px] text-slate-400 mt-1">Active Accounts</span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Published</span>
              <FileText size={16} className="text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{stats.published_pages}</div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1">Live CMS Pages</span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Blog Posts</span>
              <Newspaper size={16} className="text-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {stats.published_blog_posts} <span className="text-xs font-normal text-slate-400">/ {stats.total_blog_posts}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Published Articles</span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Storage</span>
              <HardDrive size={16} className="text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{formatBytes(stats.storage_bytes)}</div>
            <span className="text-[10px] text-slate-400 mt-1">Media Files Size</span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Drafts</span>
              <Clock size={16} className="text-orange-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{stats.draft_pages}</div>
            <span className="text-[10px] text-slate-400 mt-1">Unpublished Pages</span>
          </div>
        </div>
      )}

      {/* Main Activity Grid */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Audit & Activity Feed */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">Recent Audit Logs</h3>
              </div>
              <Link href="/audit-logs" className="text-xs font-bold text-slate-600 hover:text-amber-600 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {stats.recent_activity.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No activity recorded yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {stats.recent_activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 text-xs border-b border-slate-100 pb-2.5 last:border-none">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] shrink-0">
                      {a.user_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold text-slate-900">{a.user_name}</span>
                      <span className="text-slate-500 mt-0.5">{a.action}</span>
                      <span className="text-[10px] text-slate-400 mt-1">{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* User Sign-ins & Security */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-500" />
                <h3 className="font-bold text-sm text-slate-900">Recent User Sign-ins</h3>
              </div>
              <Link href="/users" className="text-xs font-bold text-slate-600 hover:text-amber-600 flex items-center gap-1">
                Users <ArrowRight size={12} />
              </Link>
            </div>

            {stats.recent_logins.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No sign-ins logged yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {stats.recent_logins.map((u) => (
                  <li key={u.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5 last:border-none">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                        {u.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900">{u.full_name}</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(u.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Latest Media Files */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-purple-500" />
                <h3 className="font-bold text-sm text-slate-900">Latest Media Uploads</h3>
              </div>
              <Link href="/media" className="text-xs font-bold text-slate-600 hover:text-amber-600 flex items-center gap-1">
                Media <ArrowRight size={12} />
              </Link>
            </div>

            {stats.latest_uploads.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No media uploaded yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {stats.latest_uploads.map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5 last:border-none">
                    <span className="truncate font-bold text-slate-900 max-w-[170px]">{m.file_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col gap-4">
        <h3 className="font-bold text-base text-slate-900">CMS Quick Management Modules</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/pages"
            className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 hover:bg-slate-100 hover:border-slate-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <FileText size={18} className="text-slate-700 group-hover:text-amber-600 transition-colors" />
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="font-bold text-sm text-slate-900">Fixed Pages</span>
            <span className="text-xs text-slate-500">Edit homepage, about, and landing page blocks.</span>
          </Link>

          <Link
            href="/properties"
            className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 hover:bg-slate-100 hover:border-slate-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Building2 size={18} className="text-slate-700 group-hover:text-amber-600 transition-colors" />
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="font-bold text-sm text-slate-900">Properties</span>
            <span className="text-xs text-slate-500">Manage real estate listings and luxury villas.</span>
          </Link>

          <Link
            href="/blog"
            className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 hover:bg-slate-100 hover:border-slate-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Newspaper size={18} className="text-slate-700 group-hover:text-amber-600 transition-colors" />
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="font-bold text-sm text-slate-900">Blog Posts</span>
            <span className="text-xs text-slate-500">Publish articles, insights, and news posts.</span>
          </Link>

          <Link
            href="/seo"
            className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 hover:bg-slate-100 hover:border-slate-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Globe size={18} className="text-slate-700 group-hover:text-amber-600 transition-colors" />
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="font-bold text-sm text-slate-900">SEO Module</span>
            <span className="text-xs text-slate-500">PageSpeed, rankings, schema & technical SEO.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
