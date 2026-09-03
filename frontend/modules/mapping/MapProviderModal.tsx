"use client";

import { useState, useEffect, useCallback } from "react";
import type { MapProviderConfig, MapProviderType } from "@/lib/layers";
import { mappingService } from "@/services/mapping";

type Props = {
  projectId: string;
  currentProvider?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (providerType: string) => void;
};

export default function MapProviderModal({
  projectId,
  currentProvider = "google",
  isOpen,
  onClose,
  onUpdate,
}: Props) {
  const [selectedType, setSelectedType] = useState<MapProviderType>(
    currentProvider as MapProviderType,
  );

  const [apiKey, setApiKey] = useState("");
  const [tileUrl, setTileUrl] = useState("");
  const [styleUrl, setStyleUrl] = useState("");
  const [attribution, setAttribution] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  /*
   * Google Satellite is a Google Maps display mode, not a separate
   * credential/provider configuration.
   *
   * Therefore both:
   *   google
   *   google_satellite
   *
   * use the credentials stored under:
   *   google
   */
  const getConfigProviderType = useCallback(
    (providerType: MapProviderType): MapProviderType => {
      return providerType === "google_satellite"
        ? "google"
        : providerType;
    },
    [],
  );

  const clearProviderFields = useCallback(() => {
    setApiKey("");
    setTileUrl("");
    setStyleUrl("");
    setAttribution("");
  }, []);

  const fetchProvider = useCallback(
    async (providerType: MapProviderType) => {
      setLoading(true);

      try {
        const providers = await mappingService.listProviders();

        const configProviderType = getConfigProviderType(providerType);

        const found = providers.find(
          (p: MapProviderConfig) =>
            p.providerType === configProviderType,
        );

        if (found) {
          setApiKey(found.apiKey || "");
          setTileUrl(found.tileUrl || "");
          setStyleUrl(found.styleUrl || "");
          setAttribution(found.attribution || "");
        } else {
          clearProviderFields();
        }
      } catch {
        clearProviderFields();
      } finally {
        setLoading(false);
      }
    },
    [clearProviderFields, getConfigProviderType],
  );

  /*
   * Important:
   * Keep the modal's selected provider synchronized with the project.
   *
   * The old implementation only initialized useState once, so if the
   * selected project/provider changed, selectedType could remain stale.
   */
  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [prevCurrentProvider, setPrevCurrentProvider] = useState(currentProvider);
  if (prevOpen !== isOpen || prevCurrentProvider !== currentProvider) {
    setPrevOpen(isOpen);
    setPrevCurrentProvider(currentProvider);
    if (isOpen) {
      setSelectedType(currentProvider as MapProviderType);
      setStatus(null);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const provider = currentProvider as MapProviderType;
    fetchProvider(provider);
  }, [isOpen, currentProvider, fetchProvider]);

  /*
   * When the administrator changes provider in the dropdown, load that
   * provider's existing configuration immediately instead of continuing
   * to display fields from the previous provider.
   */
  const handleProviderChange = async (providerType: MapProviderType) => {
    setSelectedType(providerType);
    setStatus(null);

    await fetchProvider(providerType);
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      /*
       * google_satellite is NOT a separate credential provider.
       *
       * Store Google credentials under "google" while the project itself
       * remains "google_satellite".
       */
      const configProviderType =
        getConfigProviderType(selectedType);

      await mappingService.upsertProvider({
        providerType: configProviderType,
        apiKey,
        tileUrl,
        styleUrl,
        attribution,
      });

      /*
       * The project DOES store google_satellite because this determines
       * which Google basemap is initially displayed.
       */
      await mappingService.updateProject(projectId, {
        mapProviderType: selectedType,
      });

      onUpdate(selectedType);

      setStatus("Map provider updated successfully.");

      setTimeout(onClose, 800);
    } catch {
      setStatus("Failed to update provider configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h2 className="text-base font-semibold text-zinc-900">
            Configure Map Provider
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
              Select Provider
            </label>

            <select
              value={selectedType}
              onChange={(e) =>
                handleProviderChange(
                  e.target.value as MapProviderType,
                )
              }
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 outline-none"
              style={{ colorScheme: "light" }}
              disabled={loading || saving}
            >
              <option value="google">
                Google Maps (Default)
              </option>

              <option value="google_satellite">
                Google Satellite
              </option>

              <option value="mapbox">
                Mapbox Tiles / Styles
              </option>

              <option value="osm">
                OpenStreetMap (Standard XYZ)
              </option>

              <option value="gee">
                Google Earth Engine (GEE)
              </option>

              <option value="custom">
                Custom XYZ Tile Server
              </option>
            </select>
          </div>

          {(selectedType === "google" ||
            selectedType === "google_satellite") && (
            <div>
              <label className="text-xs font-medium text-zinc-700">
                Google Maps API Key
              </label>

              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none"
              />

              {selectedType === "google_satellite" && (
                <p className="mt-1 text-[10px] text-zinc-400">
                  Satellite imagery uses the same Google Maps API key.
                </p>
              )}
            </div>
          )}

          {selectedType === "mapbox" && (
            <>
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Mapbox Access Token
                </label>

                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="pk.eyJ1I..."
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Mapbox Style URL / Tile Template
                </label>

                <input
                  type="text"
                  value={styleUrl}
                  onChange={(e) => setStyleUrl(e.target.value)}
                  placeholder="mapbox://styles/mapbox/satellite-v9"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none"
                />
              </div>
            </>
          )}

          {(selectedType === "xyz" ||
            selectedType === "custom" ||
            selectedType === "gee") && (
            <>
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  XYZ Tile URL Template
                </label>

                <input
                  type="text"
                  value={tileUrl}
                  onChange={(e) => setTileUrl(e.target.value)}
                  placeholder="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Map Attribution
                </label>

                <input
                  type="text"
                  value={attribution}
                  onChange={(e) => setAttribution(e.target.value)}
                  placeholder="© OpenStreetMap contributors"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none"
                />
              </div>
            </>
          )}

          {status && (
            <p className="text-xs font-medium text-blue-600">
              {status}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Apply Map Provider"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}