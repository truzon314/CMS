"use client";

import { useState, useEffect } from "react";
import type { ProjectConfig, LayerConfig } from "@/lib/layers";
import { mappingService } from "@/services/mapping";

type Props = {
  project: ProjectConfig;
  layers: LayerConfig[];
  isOpen: boolean;
  onClose: () => void;
};

export default function ApiEmbedModal({
  project,
  layers,
  isOpen,
  onClose,
}: Props) {
  const [shareToken, setShareToken] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && project) {
      fetchToken();
    }
  }, [isOpen, project]);

  const fetchToken = async () => {
    try {
      const link = await mappingService.getShareLink(project.id);
      setShareToken(link ? link.token : project.shareToken);
    } catch {
      setShareToken(project.shareToken);
    }
  };

  if (!isOpen || !project) return null;

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const apiOrigin =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  const publicViewUrl = `${origin}/view/${shareToken}`;
  const embedCode = `<iframe src="${publicViewUrl}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`;
  const publicApiUrl = `${apiOrigin}/public/mapping/${shareToken}`;
  const sampleLayerId = layers.length > 0 ? layers[0].id : "sample-layer-id";
  const publicLayerApiUrl = `${apiOrigin}/public/mapping/${shareToken}/layers/${sampleLayerId}`;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              API & Embed Generator — {project.name}
            </h2>
            <p className="text-xs text-zinc-500">
              Public endpoints & website embedding code
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-5 text-xs">
          {/* 1. Public Viewer Link */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-zinc-800">
                🌐 Public Web View URL
              </span>
              <button
                onClick={() => copyToClipboard(publicViewUrl, "viewUrl")}
                className="text-blue-600 font-medium hover:underline"
              >
                {copiedKey === "viewUrl" ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <input
              readOnly
              value={publicViewUrl}
              onFocus={(e) => e.target.select()}
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-[11px] text-zinc-700 outline-none"
            />
          </div>

          {/* 2. iFrame Embed HTML */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-zinc-800">
                📦 Website iFrame Embed Code
              </span>
              <button
                onClick={() => copyToClipboard(embedCode, "embed")}
                className="text-blue-600 font-medium hover:underline"
              >
                {copiedKey === "embed" ? "Copied!" : "Copy iFrame Snippet"}
              </button>
            </div>
            <textarea
              readOnly
              rows={2}
              value={embedCode}
              onFocus={(e) => e.target.select()}
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-[11px] text-zinc-700 outline-none"
            />
          </div>

          {/* 3. Public REST API Endpoint */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-zinc-800">
                ⚡ Public Project REST API
              </span>
              <button
                onClick={() => copyToClipboard(publicApiUrl, "publicApi")}
                className="text-blue-600 font-medium hover:underline"
              >
                {copiedKey === "publicApi" ? "Copied!" : "Copy URL"}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mb-1">
              GET endpoint returning project metadata, provider configuration,
              and layer registry:
            </p>
            <input
              readOnly
              value={publicApiUrl}
              onFocus={(e) => e.target.select()}
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-[11px] text-zinc-700 outline-none"
            />
          </div>

          {/* 4. Public Layer Features GeoJSON API */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-zinc-800">
                🗺️ Public Layer GeoJSON Feature API
              </span>
              <button
                onClick={() => copyToClipboard(publicLayerApiUrl, "layerApi")}
                className="text-blue-600 font-medium hover:underline"
              >
                {copiedKey === "layerApi" ? "Copied!" : "Copy URL"}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mb-1">
              GET endpoint returning GeoJSON FeatureCollection for vector plots:
            </p>
            <input
              readOnly
              value={publicLayerApiUrl}
              onFocus={(e) => e.target.select()}
              className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-[11px] text-zinc-700 outline-none"
            />
          </div>

          {/* 5. Admin API Overview */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3.5">
            <h3 className="font-semibold text-blue-900 mb-1">
              🔒 Admin REST APIs (Authenticated Session)
            </h3>
            <ul className="space-y-1 font-mono text-[11px] text-blue-800">
              <li>
                • GET/POST/PATCH/DELETE{" "}
                <span className="font-bold">/api/v1/mapping/projects</span>{" "}
                (Manage projects)
              </li>
              <li>
                • POST <span className="font-bold">/api/gis/upload</span>{" "}
                (Upload .shp / .geojson / .zip)
              </li>
              <li>
                • GET/POST/DELETE{" "}
                <span className="font-bold">/api/v1/mapping/providers</span>{" "}
                (Mapbox, GEE, OSM config)
              </li>
              <li>
                • GET/POST{" "}
                <span className="font-bold">/api/v1/mapping/share-links</span>{" "}
                (Manage token, password & expiry)
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
