"use client";

import { useState, useEffect } from "react";
import type { ProjectConfig, ShareLinkConfig } from "@/lib/layers";
import { mappingService } from "@/services/mapping";

type Props = {
  project: ProjectConfig;
  isOpen: boolean;
  onClose: () => void;
};

export default function ShareLinkModal({ project, isOpen, onClose }: Props) {
  const [shareConfig, setShareConfig] = useState<ShareLinkConfig | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [maxViews, setMaxViews] = useState<number | "">("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && project) {
      fetchShareConfig();
    }
  }, [isOpen, project]);

  const fetchShareConfig = async () => {
    try {
      const link = await mappingService.getShareLink(project.id);
      if (link) {
        setShareConfig(link);
        setIsActive(link.isActive);
        setExpiresAt(link.expiresAt ? link.expiresAt.split("T")[0] : "");
        setMaxViews(link.maxViews ?? "");
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen || !project) return null;

  const currentToken = shareConfig?.token || project.shareToken;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/view/${currentToken}`
      : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSave = async (rotate = false) => {
    setSaving(true);
    setStatus(null);
    try {
      const link = await mappingService.upsertShareLink({
        projectId: project.id,
        isActive,
        password: removePassword ? null : password ? password : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        maxViews: maxViews !== "" ? Number(maxViews) : null,
        rotateToken: rotate,
      });

      setShareConfig(link);
      setPassword("");
      setRemovePassword(false);
      setStatus(
        rotate
          ? "Token rotated! New share URL active."
          : "Share link settings saved.",
      );
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus("Error saving share settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h2 className="text-base font-semibold text-zinc-900">
            Public Share Settings — {project.name}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-700">
              Public Share URL
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-800 outline-none"
              />
              <button
                onClick={copyLink}
                className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div>
              <p className="text-xs font-medium text-zinc-800">
                Enable Public Access
              </p>
              <p className="text-[11px] text-zinc-500">
                Allow read-only visitors with this link to view plots
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700">
              Optional Password Protection
            </label>
            {shareConfig?.hasPassword && !removePassword ? (
              <div className="mt-1 flex items-center justify-between text-xs text-emerald-600">
                <span>🔒 Link is currently password protected</span>
                <button
                  onClick={() => setRemovePassword(true)}
                  className="text-red-500 hover:underline font-medium"
                >
                  Remove Password
                </button>
              </div>
            ) : (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set access password (leave blank for none)"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none"
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-700">
                Expiration Date
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700">
                Max Views Limit
              </label>
              <input
                type="number"
                value={maxViews}
                onChange={(e) =>
                  setMaxViews(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="Unlimited"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none"
              />
            </div>
          </div>

          {shareConfig && (
            <p className="text-[11px] text-zinc-500">
              Total Recorded Views:{" "}
              <span className="font-medium text-zinc-800">
                {shareConfig.viewCount}
              </span>
            </p>
          )}

          {status && (
            <p className="text-xs font-medium text-blue-600">{status}</p>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              🔄 Revoke & Rotate Token
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Link Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
