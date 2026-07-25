"use client";

import { useState } from "react";
import { useSeoAudit, useGlobalSchema, useRedirectsList, useRedirectActions, useAiGenerate } from "@/hooks/useSeo";
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
} from "lucide-react";
import type { SettingsUpdatePayload } from "@/types/settings";

type Tab = "audit" | "global" | "local" | "redirects" | "ai" | "schema";

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
  const [aiTask, setAiTask] = useState<"title" | "description" | "keywords" | "faqs">("title");
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
            Centralized Search Engine Optimization, Technical Audits, Local SEO & AI Assistant.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b bg-white p-2 rounded-lg shadow-sm">
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "audit" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <BarChart3 size={15} /> SEO Audit & Health
        </button>
        <button
          onClick={() => setActiveTab("global")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "global" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <Settings size={15} /> Global SEO Settings
        </button>
        <button
          onClick={() => setActiveTab("local")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "local" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <MapPin size={15} /> Local SEO
        </button>
        <button
          onClick={() => setActiveTab("redirects")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "redirects" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <ArrowRightLeft size={15} /> Redirects (301/302)
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "ai" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <Sparkles size={15} /> AI SEO Assistant
        </button>
        <button
          onClick={() => setActiveTab("schema")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
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
            <p className="text-xs text-neutral-500">Generate optimized Titles, Meta Descriptions, Keywords, and FAQs in seconds.</p>
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
