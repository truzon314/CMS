"use client";

import { useState } from "react";
import {
  useSeoAudit,
  useGlobalSchema,
  useRedirectsList,
  useRedirectActions,
  useAiGenerate,
  useExportReport,
  useAutocomplete,
  usePageSpeed,
  useRankings,
  useBacklinks,
} from "@/hooks/useSeo";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { TextField } from "@/components/forms/TextField";
import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { SelectField } from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Settings,
  MapPin,
  ArrowRightLeft,
  Sparkles,
  Code,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Download,
  Gauge,
  TrendingUp,
  Search,
  Link as LinkIcon,
  KeyRound,
  Zap,
} from "lucide-react";
import type { SettingsUpdatePayload } from "@/types/settings";

type Tab = "audit" | "pagespeed" | "rankings" | "autocomplete" | "backlinks" | "global" | "local" | "redirects" | "ai" | "schema";

export default function SeoManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("audit");

  // Data queries & mutations
  const { data: audit, isLoading: loadingAudit } = useSeoAudit();
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: globalSchema } = useGlobalSchema();
  const { data: redirects } = useRedirectsList();
  const { createRedirect, deleteRedirect } = useRedirectActions();
  const aiGenerate = useAiGenerate();
  const { refetch: fetchExportReport, isFetching: exporting } = useExportReport();

  // PageSpeed
  const [pageSpeedUrl, setPageSpeedUrl] = useState("https://truzonhomes.com");
  const { data: pageSpeedData, isFetching: loadingPageSpeed, refetch: refetchPageSpeed } = usePageSpeed(pageSpeedUrl);

  // Rankings (Google Search Console)
  const { data: rankingsData, isLoading: loadingRankings } = useRankings();

  // Backlinks (Ahrefs)
  const [backlinksTarget, setBacklinksTarget] = useState("truzonhomes.com");
  const { data: backlinksData, isLoading: loadingBacklinks } = useBacklinks(backlinksTarget);

  // Autocomplete
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const autocomplete = useAutocomplete();

  const handleExportReport = async () => {
    const res = await fetchExportReport();
    if (res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `seo-audit-report-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleAutocompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autocompleteQuery.trim()) return;
    autocomplete.mutate(autocompleteQuery.trim());
  };

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SettingsUpdatePayload>({});
  const currentSettings = { ...settingsData, ...settingsForm };

  const handleSettingChange = (field: keyof SettingsUpdatePayload, val: unknown) => {
    setSettingsForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveSettings = async () => {
    await updateSettings.mutateAsync(settingsForm);
    setSettingsForm({});
  };

  // Redirect form state
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [statusCode, setStatusCode] = useState(301);

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromPath || !toPath) return;
    await createRedirect.mutateAsync({ from_path: fromPath, to_path: toPath, status_code: Number(statusCode) });
    setFromPath("");
    setToPath("");
  };

  // AI Prompt State
  const [aiTopic, setAiTopic] = useState("");
  const [aiKeyword, setAiKeyword] = useState("");
  const [aiTask, setAiTask] = useState<"title" | "description" | "keywords" | "faqs" | "alt_text" | "property_description">("title");
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic) return;
    const res = await aiGenerate.mutateAsync({
      task_type: aiTask,
      topic_or_context: aiTopic,
      target_keyword: aiKeyword || undefined,
    });
    setAiResult(res);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">SEO Management Module</h1>
          <p className="text-sm text-neutral-500">
            Centralized Search Engine Optimization, PageSpeed, Rankings, Local SEO & AI Assistant.
          </p>
        </div>
        <Button onClick={handleExportReport} variant="outline" size="sm" disabled={exporting} className="self-start sm:self-auto">
          <Download size={15} className="mr-1.5" /> {exporting ? "Exporting…" : "Export Audit Report (JSON)"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b bg-white p-2 rounded-lg shadow-sm">
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "audit" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <BarChart3 size={15} /> SEO Audit & Health
        </button>
        <button
          onClick={() => setActiveTab("pagespeed")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "pagespeed" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <Gauge size={15} /> PageSpeed & Vitals
        </button>
        <button
          onClick={() => setActiveTab("rankings")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "rankings" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <TrendingUp size={15} /> Search Rankings
        </button>
        <button
          onClick={() => setActiveTab("autocomplete")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "autocomplete" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <Search size={15} /> Autocomplete Monitor
        </button>
        <button
          onClick={() => setActiveTab("backlinks")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "backlinks" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <LinkIcon size={15} /> Backlinks
        </button>
        <button
          onClick={() => setActiveTab("global")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "global" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <Settings size={15} /> Global Settings
        </button>
        <button
          onClick={() => setActiveTab("local")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "local" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <MapPin size={15} /> Local SEO
        </button>
        <button
          onClick={() => setActiveTab("redirects")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "redirects" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <ArrowRightLeft size={15} /> Redirects (301/302)
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "ai" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <Sparkles size={15} /> AI Assistant
        </button>
        <button
          onClick={() => setActiveTab("schema")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "schema" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <Code size={15} /> JSON-LD Schemas
        </button>
      </div>

      {/* TAB 1: AUDIT & HEALTH */}
      {activeTab === "audit" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border shadow-sm">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Health Score</span>
              <div className={`mt-2 text-4xl font-extrabold ${
                (audit?.health_score ?? 100) >= 80 ? "text-emerald-600" : (audit?.health_score ?? 100) >= 50 ? "text-amber-600" : "text-red-600"
              }`}>
                {loadingAudit ? "…" : `${audit?.health_score ?? 100}/100`}
              </div>
              <span className="text-xs text-neutral-500 mt-1">Technical SEO Health</span>
            </div>

            <div className="flex flex-col p-5 bg-white rounded-xl border shadow-sm">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Scanned Items</span>
              <div className="mt-2 text-2xl font-bold text-neutral-900">{audit?.total_pages_scanned ?? 0} Pages</div>
              <div className="text-xs text-neutral-500 mt-1">{audit?.total_images_scanned ?? 0} Media Images</div>
            </div>

            <div className="flex flex-col p-5 bg-white rounded-xl border shadow-sm">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Missing Meta Descriptions</span>
              <div className="mt-2 text-2xl font-bold text-amber-600">{audit?.missing_meta_description?.length ?? 0} Items</div>
              <span className="text-xs text-neutral-500 mt-1">Requires description snippet</span>
            </div>

            <div className="flex flex-col p-5 bg-white rounded-xl border shadow-sm">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Missing Alt Text</span>
              <div className="mt-2 text-2xl font-bold text-amber-600">{audit?.missing_alt_images?.length ?? 0} Images</div>
              <span className="text-xs text-neutral-500 mt-1">Images missing alt tags</span>
            </div>
          </div>

          {/* Audit Checklist */}
          <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-base text-neutral-900">Technical Audit Findings</h3>
            
            {audit?.missing_meta_description && audit.missing_meta_description.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-sm text-amber-900">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>Missing Meta Description ({audit.missing_meta_description.length})</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {audit.missing_meta_description.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.link}
                      className="inline-flex items-center gap-1 text-xs font-medium bg-white px-2.5 py-1 rounded border border-amber-300 text-amber-900 hover:underline"
                    >
                      {item.type}: {item.name} <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {audit?.missing_alt_images && audit.missing_alt_images.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-sm text-amber-900">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>Missing Alt Text on Images ({audit.missing_alt_images.length})</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {audit.missing_alt_images.map((img) => (
                    <span key={img.id} className="text-xs bg-white px-2.5 py-1 rounded border border-amber-300 text-amber-900">
                      {img.filename}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {audit?.missing_meta_description?.length === 0 && audit?.missing_alt_images?.length === 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>All pages and media pass technical SEO audit standards!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PAGESPEED & CORE WEB VITALS (real Google PageSpeed Insights) */}
      {activeTab === "pagespeed" && (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <TextField
                label="Target URL to Audit"
                value={pageSpeedUrl}
                onChange={(e) => setPageSpeedUrl(e.target.value)}
                placeholder="https://truzonhomes.com"
              />
            </div>
            <Button onClick={() => refetchPageSpeed()} disabled={loadingPageSpeed}>
              <Zap size={16} className="mr-1.5" /> {loadingPageSpeed ? "Running…" : "Run PageSpeed Diagnostic"}
            </Button>
          </div>

          {pageSpeedData && "configured" in pageSpeedData && pageSpeedData.configured === false ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-neutral-50 p-10 text-center">
              <Gauge size={28} className="text-neutral-400" />
              <p className="text-sm font-semibold text-neutral-700">Not connected to Google PageSpeed Insights</p>
              <p className="text-xs text-neutral-500 max-w-md">
                Add a free Google PageSpeed API key under Global Settings → API Integrations to see real Core Web
                Vitals for this URL.
              </p>
              <Button size="sm" variant="outline" onClick={() => setActiveTab("global")}>
                Go to Global Settings
              </Button>
            </div>
          ) : pageSpeedData && "scores" in pageSpeedData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(["performance", "accessibility", "best_practices", "seo"] as const).map((key) => (
                  <div key={key} className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border shadow-sm">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{key.replace("_", " ")}</span>
                    <div className="mt-2 text-4xl font-extrabold text-emerald-600">
                      {pageSpeedData.scores[key] ?? "—"}
                      {pageSpeedData.scores[key] != null ? "/100" : ""}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-bold text-base text-neutral-900">Core Web Vitals Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(pageSpeedData.metrics).map(([key, metric]) => (
                    <div key={key} className="rounded-lg border p-4 bg-neutral-50 flex flex-col gap-1">
                      <span className="text-xs font-semibold text-neutral-500">{key.replace(/_/g, " ")}</span>
                      <span className="text-xl font-extrabold text-emerald-600">{metric?.value ?? "—"}</span>
                    </div>
                  ))}
                </div>

                {pageSpeedData.diagnostics.length > 0 && (
                  <>
                    <h4 className="font-semibold text-sm text-neutral-900 mt-2">Failing Diagnostics</h4>
                    <div className="flex flex-col gap-2">
                      {pageSpeedData.diagnostics.map((diag) => (
                        <div key={diag.id} className="flex items-center gap-2 text-xs text-neutral-700 bg-amber-50/60 p-2.5 rounded border border-amber-200">
                          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                          <span>{diag.title}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed bg-neutral-50 p-10 text-center text-sm text-neutral-500">
              Click &ldquo;Run PageSpeed Diagnostic&rdquo; to fetch real Lighthouse data for this URL.
            </div>
          )}
        </div>
      )}

      {/* TAB: SEARCH RANKINGS (real Google Search Console query performance) */}
      {activeTab === "rankings" && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col gap-4 p-6">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Search Console Query Performance</h3>
            <p className="text-xs text-neutral-500">Real clicks, impressions, CTR, and average position from Google Search Console (last 28 days, 3-day data lag).</p>
          </div>

          {loadingRankings ? (
            <div className="p-10 text-center text-sm text-neutral-500">Loading…</div>
          ) : rankingsData && "configured" in rankingsData && rankingsData.configured === false ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-neutral-50 p-10 text-center">
              <TrendingUp size={28} className="text-neutral-400" />
              <p className="text-sm font-semibold text-neutral-700">Not connected to Google Search Console</p>
              <p className="text-xs text-neutral-500 max-w-md">
                Add a Search Console service account under Global Settings → API Integrations to see real ranking
                data. This needs Google Cloud + Search Console setup — see the instructions there.
              </p>
              <Button size="sm" variant="outline" onClick={() => setActiveTab("global")}>
                Go to Global Settings
              </Button>
            </div>
          ) : rankingsData && "rows" in rankingsData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 text-neutral-500 uppercase font-medium border-b">
                  <tr>
                    <th className="px-4 py-3">Query</th>
                    <th className="px-4 py-3">Clicks</th>
                    <th className="px-4 py-3">Impressions</th>
                    <th className="px-4 py-3">CTR</th>
                    <th className="px-4 py-3 text-right">Avg Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rankingsData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-semibold text-neutral-900">{row.keyword}</td>
                      <td className="px-4 py-3 font-medium">{row.clicks}</td>
                      <td className="px-4 py-3 font-medium">{row.impressions}</td>
                      <td className="px-4 py-3 font-medium">{row.ctr_percent}%</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">#{row.avg_position}</td>
                    </tr>
                  ))}
                  {rankingsData.rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                        No query data returned for this date range yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB: AUTOCOMPLETE MONITOR (real Google Autocomplete, free public endpoint) */}
      {activeTab === "autocomplete" && (
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col gap-6 max-w-2xl">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Google Autocomplete Monitor</h3>
            <p className="text-xs text-neutral-500">
              Real suggestions pulled live from Google&rsquo;s public autocomplete endpoint — no API key needed. This
              is an unofficial endpoint (the same one browser address bars use), so treat results as best-effort,
              not a guaranteed API.
            </p>
          </div>

          <form onSubmit={handleAutocompleteSubmit} className="flex gap-3 items-end">
            <div className="flex-1">
              <TextField
                label="Seed Keyword"
                value={autocompleteQuery}
                onChange={(e) => setAutocompleteQuery(e.target.value)}
                placeholder="e.g. truzon homes"
              />
            </div>
            <Button type="submit" disabled={autocomplete.isPending}>
              <Search size={15} className="mr-1.5" /> {autocomplete.isPending ? "Fetching…" : "Get Suggestions"}
            </Button>
          </form>

          {autocomplete.data && (
            <div className="flex flex-col gap-2">
              {autocomplete.data.suggestions.length === 0 && (
                <p className="text-xs text-neutral-500">Google returned no suggestions for this query.</p>
              )}
              {autocomplete.data.suggestions.map((term, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-neutral-50 p-2.5 rounded border">
                  <span className="font-mono text-neutral-800">{term}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: BACKLINKS (real Ahrefs Site Explorer data) */}
      {activeTab === "backlinks" && (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <TextField
                label="Target Domain"
                value={backlinksTarget}
                onChange={(e) => setBacklinksTarget(e.target.value)}
                placeholder="truzonhomes.com"
              />
            </div>
          </div>

          {loadingBacklinks ? (
            <div className="p-10 text-center text-sm text-neutral-500">Loading…</div>
          ) : backlinksData && "configured" in backlinksData && backlinksData.configured === false ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-neutral-50 p-10 text-center">
              <LinkIcon size={28} className="text-neutral-400" />
              <p className="text-sm font-semibold text-neutral-700">Not connected to Ahrefs</p>
              <p className="text-xs text-neutral-500 max-w-md">
                Add your Ahrefs API key under Global Settings → API Integrations to see real backlink data.
              </p>
              <Button size="sm" variant="outline" onClick={() => setActiveTab("global")}>
                Go to Global Settings
              </Button>
            </div>
          ) : backlinksData && "metrics" in backlinksData ? (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col gap-4 p-6">
              <h3 className="font-bold text-base text-neutral-900">Raw Ahrefs Response</h3>
              <p className="text-xs text-neutral-500">
                Showing the raw API response rather than a fixed field mapping — Ahrefs&rsquo; exact response shape
                depends on your plan/API version, so nothing here is guessed or faked.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-neutral-700 uppercase mb-2">Domain Metrics</h4>
                  <pre className="text-[11px] font-mono bg-neutral-900 text-emerald-400 p-3 rounded h-64 overflow-y-auto">
                    {JSON.stringify(backlinksData.metrics, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-700 uppercase mb-2">Backlinks</h4>
                  <pre className="text-[11px] font-mono bg-neutral-900 text-emerald-400 p-3 rounded h-64 overflow-y-auto">
                    {JSON.stringify(backlinksData.backlinks, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: GLOBAL SEO SETTINGS */}
      {activeTab === "global" && (
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col gap-6 max-w-4xl">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-bold text-base text-neutral-900">Global Search & Tracking Settings</h3>
              <p className="text-xs text-neutral-500">Configure search engine verification, analytics IDs, and fallback metadata.</p>
            </div>
            <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Organization Name"
              value={currentSettings.organization_name ?? ""}
              onChange={(e) => handleSettingChange("organization_name", e.target.value)}
              placeholder="Truzon Homes"
            />
            <TextField
              label="Default Meta Title"
              value={currentSettings.default_meta_title ?? ""}
              onChange={(e) => handleSettingChange("default_meta_title", e.target.value)}
              placeholder="Truzon Homes — Premium Real Estate & Luxury Villas"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-700">Default Meta Description</label>
            <textarea
              value={currentSettings.default_meta_description ?? ""}
              onChange={(e) => handleSettingChange("default_meta_description", e.target.value)}
              placeholder="Default site summary used when page-specific description is absent."
              rows={3}
              className="w-full rounded-md border border-neutral-300 p-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <h4 className="font-semibold text-sm text-neutral-900 pt-2 border-t">Search Engine Verification Codes</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="Google Site Verification"
              value={currentSettings.google_verification_code ?? ""}
              onChange={(e) => handleSettingChange("google_verification_code", e.target.value)}
              placeholder="google-site-verification=..."
            />
            <TextField
              label="Bing Webmaster Code"
              value={currentSettings.bing_verification_code ?? ""}
              onChange={(e) => handleSettingChange("bing_verification_code", e.target.value)}
              placeholder="Bing verification code"
            />
            <TextField
              label="Google Search Console ID"
              value={currentSettings.google_search_console_verification ?? ""}
              onChange={(e) => handleSettingChange("google_search_console_verification", e.target.value)}
              placeholder="GSC Property ID"
            />
          </div>

          <h4 className="font-semibold text-sm text-neutral-900 pt-2 border-t">Analytics & Tracking Integrations</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="GA4 Measurement ID"
              value={currentSettings.analytics_ga_measurement_id ?? ""}
              onChange={(e) => handleSettingChange("analytics_ga_measurement_id", e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
            <TextField
              label="Google Tag Manager ID"
              value={currentSettings.google_tag_manager_id ?? ""}
              onChange={(e) => handleSettingChange("google_tag_manager_id", e.target.value)}
              placeholder="GTM-XXXXXXX"
            />
            <TextField
              label="Meta (Facebook) Pixel ID"
              value={currentSettings.meta_pixel_id ?? ""}
              onChange={(e) => handleSettingChange("meta_pixel_id", e.target.value)}
              placeholder="123456789012345"
            />
          </div>

          <h4 className="font-semibold text-sm text-neutral-900 pt-2 border-t">Social & Robots Defaults</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImagePickerField
              label="Default Open Graph Share Image"
              recommendedDimensions="1200 × 630 px (Social Share)"
              mediaId={currentSettings.og_default_image_media_id ?? null}
              onChange={(val) => handleSettingChange("og_default_image_media_id", val.mediaId)}
            />
            <SelectField
              label="Default Twitter Card Type"
              value={currentSettings.twitter_card_default_type ?? "summary_large_image"}
              onChange={(val) => handleSettingChange("twitter_card_default_type", val)}
              options={[
                { value: "summary_large_image", label: "Summary Card with Large Image" },
                { value: "summary", label: "Summary Card" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t">
            <label className="text-xs font-medium text-neutral-700">Robots.txt Content Editor</label>
            <textarea
              value={currentSettings.robots_txt_content ?? "User-agent: *\nAllow: /\nSitemap: https://truzonhomes.com/sitemap.xml"}
              onChange={(e) => handleSettingChange("robots_txt_content", e.target.value)}
              rows={4}
              className="w-full rounded-md border border-neutral-300 p-2.5 font-mono text-xs focus:border-neutral-900 focus:outline-none bg-neutral-900 text-emerald-400"
            />
          </div>

          <h4 className="font-semibold text-sm text-neutral-900 pt-2 border-t flex items-center gap-2">
            <KeyRound size={15} className="text-neutral-500" /> API Integrations
          </h4>
          <p className="text-xs text-neutral-500 -mt-3">
            These power the PageSpeed, Search Rankings, and Backlinks tabs with real third-party data. Each is
            optional — those tabs show a &ldquo;not connected&rdquo; state until the matching key below is set.
          </p>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-800">Google PageSpeed Insights (free)</span>
            <TextField
              label="API Key"
              type="password"
              value={currentSettings.google_pagespeed_api_key ?? ""}
              onChange={(e) => handleSettingChange("google_pagespeed_api_key", e.target.value)}
              placeholder="AIza…"
            />
            <p className="text-[11px] text-neutral-500">
              Google Cloud Console → APIs &amp; Services → Library → enable &ldquo;PageSpeed Insights API&rdquo; →
              Credentials → Create API Key. Free tier: 25,000 requests/day, no billing account required.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-800">Google Search Console (free, needs a verified property)</span>
            <TextField
              label="Site URL (exactly as shown in Search Console)"
              value={currentSettings.google_gsc_site_url ?? ""}
              onChange={(e) => handleSettingChange("google_gsc_site_url", e.target.value)}
              placeholder="sc-domain:truzonhomes.com or https://www.truzonhomes.com/"
            />
            <label className="text-xs font-medium text-neutral-700 mt-1">Service Account JSON Key</label>
            <textarea
              value={currentSettings.google_gsc_service_account_json ?? ""}
              onChange={(e) => handleSettingChange("google_gsc_service_account_json", e.target.value)}
              placeholder="Paste the full downloaded service account JSON key here"
              rows={4}
              className="w-full rounded-md border border-neutral-300 p-2.5 font-mono text-xs focus:border-neutral-900 focus:outline-none"
            />
            <p className="text-[11px] text-neutral-500">
              1) In Google Cloud Console, enable &ldquo;Search Console API&rdquo; and create a Service Account, then
              generate + download its JSON key. 2) In Search Console → Settings → Users and permissions → Add user,
              add the service account&rsquo;s email (from the JSON&rsquo;s <code>client_email</code>) with
              &ldquo;Restricted&rdquo; access — that&rsquo;s enough for read-only query data. 3) Paste the JSON above.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-800">Ahrefs (paid)</span>
            <TextField
              label="API Key"
              type="password"
              value={currentSettings.ahrefs_api_key ?? ""}
              onChange={(e) => handleSettingChange("ahrefs_api_key", e.target.value)}
              placeholder="Your Ahrefs API token"
            />
            <p className="text-[11px] text-neutral-500">
              From your Ahrefs account → API Access. The Backlinks tab shows Ahrefs&rsquo; raw response — verify the
              field shape matches your plan once connected.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: LOCAL SEO */}
      {activeTab === "local" && (
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col gap-6 max-w-4xl">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-bold text-base text-neutral-900">Local SEO & Business Coordinates</h3>
              <p className="text-xs text-neutral-500">Powers LocalBusiness and RealEstateAgent Google Rich Snippets.</p>
            </div>
            <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Saving…" : "Save Local SEO"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Working Hours"
              value={currentSettings.working_hours ?? ""}
              onChange={(e) => handleSettingChange("working_hours", e.target.value)}
              placeholder="Mon - Sat: 9:00 AM - 7:00 PM"
            />
            <TextField
              label="Service Areas (comma separated)"
              value={Array.isArray(currentSettings.service_areas) ? currentSettings.service_areas.join(", ") : ""}
              onChange={(e) => handleSettingChange("service_areas", e.target.value.split(",").map((s) => s.trim()))}
              placeholder="Hyderabad, Banjara Hills, Gachibowli, Jubilee Hills"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Latitude"
              type="number"
              value={currentSettings.latitude?.toString() ?? ""}
              onChange={(e) => handleSettingChange("latitude", parseFloat(e.target.value))}
              placeholder="17.4126"
            />
            <TextField
              label="Longitude"
              type="number"
              value={currentSettings.longitude?.toString() ?? ""}
              onChange={(e) => handleSettingChange("longitude", parseFloat(e.target.value))}
              placeholder="78.4482"
            />
          </div>

          <div className="rounded-lg border bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 mb-2">
              <ShieldCheck size={16} className="text-emerald-600" /> Auto-Generated Local Business Schema
            </div>
            <pre className="text-[11px] font-mono bg-neutral-900 text-emerald-400 p-3 rounded overflow-x-auto">
              {JSON.stringify(globalSchema?.local_business ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: REDIRECTS (301/302) */}
      {activeTab === "redirects" && (
        <div className="flex flex-col gap-6">
          {/* Add Redirect Form */}
          <form onSubmit={handleAddRedirect} className="rounded-xl border bg-white p-5 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <TextField
                label="Old Path (From)"
                value={fromPath}
                onChange={(e) => setFromPath(e.target.value)}
                placeholder="/old-villa-page"
              />
            </div>
            <div className="flex-1 w-full">
              <TextField
                label="New Path (To)"
                value={toPath}
                onChange={(e) => setToPath(e.target.value)}
                placeholder="/projects/luxury-villas"
              />
            </div>
            <div className="w-36">
              <SelectField
                label="HTTP Code"
                value={statusCode.toString()}
                onChange={(val) => setStatusCode(Number(val))}
                options={[
                  { value: "301", label: "301 Permanent" },
                  { value: "302", label: "302 Temporary" },
                ]}
              />
            </div>
            <Button type="submit" disabled={createRedirect.isPending}>
              <Plus size={16} className="mr-1" /> Add Redirect
            </Button>
          </form>

          {/* Redirects Table */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b font-semibold text-sm text-neutral-900">
              Active Redirect Rules ({redirects?.length ?? 0})
            </div>
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-neutral-500 uppercase font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Source Path</th>
                  <th className="px-4 py-3">Destination Path</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Hits</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(redirects ?? []).map((rule) => (
                  <tr key={rule.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono font-medium text-neutral-900">{rule.from_path}</td>
                    <td className="px-4 py-3 font-mono text-neutral-600">{rule.to_path}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">{rule.status_code}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{rule.hit_count}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteRedirect.mutate(rule.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!redirects || redirects.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                      No URL redirect rules configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AI SEO ASSISTANT */}
      {activeTab === "ai" && (
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col gap-6 max-w-4xl">
          <div>
            <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={18} /> AI SEO Generator Assistant
            </h3>
            <p className="text-xs text-neutral-500">Generate optimized Titles, Meta Descriptions, Keywords, Alt Text, Property Descriptions, and FAQs.</p>
          </div>

          <form onSubmit={handleAiSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Generation Task"
                value={aiTask}
                onChange={(val) => setAiTask(val as any)}
                options={[
                  { value: "title", label: "Optimized SEO Meta Title" },
                  { value: "description", label: "Meta Description Snippet" },
                  { value: "keywords", label: "Focus & Related Keywords" },
                  { value: "alt_text", label: "Image Alt Text Tag" },
                  { value: "property_description", label: "Property Description" },
                  { value: "faqs", label: "FAQ Question & Answer Items" },
                ]}
              />
              <TextField
                label="Target Keyword (Optional)"
                value={aiKeyword}
                onChange={(e) => setAiKeyword(e.target.value)}
                placeholder="e.g. 3 BHK villa Banjara Hills"
              />
            </div>
            <TextField
              label="Topic or Context"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. Premium 4 BHK Villas in Jubilee Hills with private swimming pool"
            />
            <Button type="submit" disabled={aiGenerate.isPending} className="self-start">
              <Sparkles size={15} className="mr-1.5" />
              {aiGenerate.isPending ? "Generating…" : "Generate SEO Suggestions"}
            </Button>
          </form>

          {aiResult && (
            <div className="rounded-lg border bg-neutral-900 p-4 text-emerald-400 font-mono text-xs flex flex-col gap-2">
              <div className="text-neutral-400 font-sans font-semibold text-xs border-b border-neutral-800 pb-2">
                AI Generation Result:
              </div>
              <pre className="whitespace-pre-wrap">{JSON.stringify(aiResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: JSON-LD SCHEMAS */}
      {activeTab === "schema" && (
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col gap-6 max-w-4xl">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Site-Wide JSON-LD Structured Data</h3>
            <p className="text-xs text-neutral-500">Live JSON-LD schema objects rendered to Google and AI search crawlers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-neutral-700 uppercase mb-2">Organization Schema</h4>
              <pre className="text-[11px] font-mono bg-neutral-900 text-emerald-400 p-3 rounded h-64 overflow-y-auto">
                {JSON.stringify(globalSchema?.organization ?? {}, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-700 uppercase mb-2">WebSite & SearchAction Schema</h4>
              <pre className="text-[11px] font-mono bg-neutral-900 text-emerald-400 p-3 rounded h-64 overflow-y-auto">
                {JSON.stringify(globalSchema?.website ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
