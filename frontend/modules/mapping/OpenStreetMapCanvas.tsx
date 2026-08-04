"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FeatureCollection, Feature } from "geojson";
import {
  LABEL_MIN_ZOOM,
  centroidOf,
  buildPropertyAllowlist,
  fontSizeForZoom,
  isPropertyAllowed,
  type LayerConfig,
  type StyleRule,
} from "@/lib/layers";
import { mappingService } from "@/services/mapping";

type Props = {
  layers: LayerConfig[];
  selectedProjectId: string | null;
  mode: "admin" | "shared";
  visibility?: Record<string, boolean>;
  shareToken?: string;
  sharePassword?: string | null;
  tileUrl?: string;
  attribution?: string;
};

/* ------------------------------------------------------------------ */
/*  Style helpers — mirror MapView.tsx's dataStyleFor for Leaflet      */
/* ------------------------------------------------------------------ */

function matchRule(
  rules: StyleRule[],
  properties: Record<string, unknown> | null | undefined
): StyleRule | null {
  if (!rules.length || !properties) return null;
  for (const rule of rules) {
    const actual = properties[rule.property];
    if (actual !== undefined && actual !== null && String(actual) === rule.value) {
      return rule;
    }
  }
  return null;
}

// Leaflet's dashArray is in pixels-along-the-line, not CSS-style ratios,
// so these are scaled up from the settings-panel preview's small SVG.
function dashArrayFor(strokeStyle: LayerConfig["strokeStyle"]): string | undefined {
  if (strokeStyle === "dashed") return "12,8";
  if (strokeStyle === "dotted") return "2,7";
  return undefined;
}

function styleForFeature(
  layer: LayerConfig,
  feature: Feature
): L.PathOptions & { show: boolean } {
  const base: L.PathOptions & { show: boolean } = {
    color: layer.strokeColor || "#0EA5E9",
    weight: layer.strokeWeight || 2,
    fillColor: layer.fillColor || "#0EA5E9",
    fillOpacity: layer.fillOpacity ?? 0.4,
    dashArray: dashArrayFor(layer.strokeStyle),
    lineCap: layer.strokeStyle === "dotted" ? "round" : undefined,
    show: true,
  };

  const rule = matchRule(layer.colorRules ?? [], feature.properties);
  if (!rule) return base;
  if (rule.action === "hide") return { ...base, show: false };
  return {
    ...base,
    fillColor: rule.color || base.fillColor,
    color: rule.color || base.color,
    fillOpacity: rule.opacity ?? base.fillOpacity,
  };
}

/* ------------------------------------------------------------------ */
/*  Popup content — built as an HTML string for Leaflet's native        */
/*  bindPopup(), so escaping is our own responsibility (properties can  */
/*  contain arbitrary text from uploaded shapefiles/GeoJSON).           */
/* ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Rebuilt (via marker.setIcon) on every zoomend so the label grows with
// fontSizeForZoom instead of staying pinned at one size — max-width scales
// alongside it so a bigger label doesn't get clipped by the old fixed box.
function buildLabelIcon(text: string, fontSize: number): L.DivIcon {
  const maxWidth = Math.round(65 * (fontSize / 10));
  return L.divIcon({
    className: "osm-label-icon",
    html: `<span style="
      display: inline-block;
      transform: translate(-50%, -50%);
      font-size: ${fontSize}px;
      font-weight: 700;
      color: #0f172a;
      text-shadow: 0 0 2px #ffffff, 0 0 4px #ffffff, 0 0 2px #ffffff;
      white-space: nowrap;
      max-width: ${maxWidth}px;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
      text-align: center;
    ">${escapeHtml(text)}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function popupHtml(
  layerName: string,
  properties: Record<string, unknown>,
  allowedProperties: string[] | null
): string {
  const allowed = buildPropertyAllowlist(allowedProperties);
  const entries = Object.entries(properties).filter(([key]) => isPropertyAllowed(key, allowed));
  const rows = entries.length
    ? entries
        .map(
          ([key, value], i) => `
            <div style="display:flex;justify-content:space-between;gap:14px;padding:6px 4px;${i % 2 === 1 ? "background:#f8fafc;" : ""}border-radius:4px;font-size:13px;">
              <span style="font-weight:600;color:#52525b;white-space:nowrap;">${escapeHtml(key)}</span>
              <span style="font-family:ui-monospace,monospace;color:#18181b;font-weight:600;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px;">${escapeHtml(String(value))}</span>
            </div>`
        )
        .join("")
    : `<span style="font-size:13px;color:#71717a;">No properties</span>`;

  return `
    <div style="min-width:240px;max-width:340px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
      <div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:15px;color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:8px;margin-bottom:8px;">
        📌 ${escapeHtml(layerName)}
      </div>
      <div style="max-height:260px;overflow-y:auto;">${rows}</div>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OpenStreetMapCanvas({
  layers,
  selectedProjectId,
  mode,
  visibility,
  shareToken,
  sharePassword,
  tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution = "© OpenStreetMap contributors",
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayersRef = useRef<Map<string, L.GeoJSON>>(new Map());
  const labelMarkersRef = useRef<{ marker: L.Marker; text: string }[]>([]);
  // Tracks the combined extent of every currently-loaded feature, kept up
  // to date independently of auto-fit-on-project-switch so the "Zoom to
  // Fit" button always has something current to fit to, even after the
  // user has manually panned/zoomed away.
  const boundsRef = useRef<L.LatLngBounds | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 20,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [tileUrl, attribution]);

  const lastFittedProjectIdRef = useRef<string | null>(null);

  // Load vector layers with color rules + labels
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let cancelled = false;

    const projectLayers = layers.filter((l) => l.projectId === selectedProjectId);

    // Clear existing layers and labels
    geojsonLayersRef.current.forEach((g) => map.removeLayer(g));
    geojsonLayersRef.current.clear();
    labelMarkersRef.current.forEach(({ marker }) => map.removeLayer(marker));
    labelMarkersRef.current = [];
    boundsRef.current = null;

    const boundsGroup = L.featureGroup();

    // Toggle label visibility based on current zoom, and re-render each
    // label's icon at the zoom-appropriate size — a divIcon's HTML is
    // static once created, so growing the font means swapping the icon,
    // not just changing a style property.
    const syncLabels = () => {
      const zoom = map.getZoom();
      const fontSize = fontSizeForZoom(zoom);
      for (const { marker, text } of labelMarkersRef.current) {
        if (zoom >= LABEL_MIN_ZOOM) {
          marker.setIcon(buildLabelIcon(text, fontSize));
          if (!map.hasLayer(marker)) map.addLayer(marker);
        } else {
          if (map.hasLayer(marker)) map.removeLayer(marker);
        }
      }
    };

    map.on("zoomend", syncLabels);

    projectLayers.forEach((layer) => {
      const isVisible = visibility ? (visibility[layer.id] ?? layer.defaultVisible) : layer.defaultVisible;
      if (!isVisible) return;

      mappingService
        .getLayerGeoJson(layer.id, shareToken, sharePassword)
        .then((geojson: FeatureCollection) => {
          if (cancelled) return;
          if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) return;

          const leafletGeoJson = L.geoJSON(geojson, {
            // Per-feature styling using colorRules
            style: (feature) => {
              if (!feature) {
                return {
                  color: layer.strokeColor || "#0EA5E9",
                  weight: layer.strokeWeight || 2,
                  fillColor: layer.fillColor || "#0EA5E9",
                  fillOpacity: layer.fillOpacity || 0.4,
                  dashArray: dashArrayFor(layer.strokeStyle),
                };
              }
              const s = styleForFeature(layer, feature as Feature);
              return {
                color: s.color,
                weight: s.weight,
                fillColor: s.fillColor,
                fillOpacity: s.fillOpacity,
                dashArray: s.dashArray,
                lineCap: s.lineCap,
              };
            },

            // Filter out hidden features
            filter: (feature) => {
              const rule = matchRule(layer.colorRules ?? [], feature.properties);
              return !rule || rule.action !== "hide";
            },

            onEachFeature: (feature: Feature, lLayer) => {
              if (layer.popupEnabled === false) return;
              lLayer.bindPopup(popupHtml(layer.label, feature.properties || {}, layer.popupProperties ?? null), {
                maxWidth: 360,
                minWidth: 240,
                className: "app-feature-popup",
              });
              // Open at the exact click point rather than the layer's
              // default anchor — for a polygon that's wherever inside the
              // plot the user clicked, not e.g. its bounding-box corner.
              lLayer.on("click", (e: L.LeafletMouseEvent) => {
                lLayer.openPopup(e.latlng);
              });
            },
          }).addTo(map);

          geojsonLayersRef.current.set(layer.id, leafletGeoJson);
          boundsGroup.addLayer(leafletGeoJson);

          // Create text labels (but only add to map if zoomed in enough)
          if (layer.labelProperty) {
            const prop = layer.labelProperty;
            const currentZoom = map.getZoom();
            const currentFontSize = fontSizeForZoom(currentZoom);
            for (const feature of geojson.features) {
              const center = centroidOf(feature.geometry);
              const text = feature.properties?.[prop];
              if (!center || text == null) continue;

              const labelText = String(text);
              const marker = L.marker(center, {
                icon: buildLabelIcon(labelText, currentFontSize),
                interactive: false,
              });

              // Only show immediately if already zoomed in
              if (currentZoom >= LABEL_MIN_ZOOM) {
                marker.addTo(map);
              }

              labelMarkersRef.current.push({ marker, text: labelText });
            }
          }

          if (boundsGroup.getLayers().length > 0) {
            boundsRef.current = boundsGroup.getBounds();
          }

          // Only auto-fit bounds when switching to a different project
          if (lastFittedProjectIdRef.current !== selectedProjectId && boundsGroup.getLayers().length > 0) {
            map.fitBounds(boundsGroup.getBounds(), { padding: [30, 30] });
            lastFittedProjectIdRef.current = selectedProjectId;
          }
        })
        .catch((err) => {
          if (!cancelled) console.error(`Failed to load layer ${layer.id} on OSM`, err);
        });
    });

    return () => {
      cancelled = true;
      map.off("zoomend", syncLabels);
    };
  }, [layers, selectedProjectId, visibility, shareToken, sharePassword]);

  const handleZoomToFit = () => {
    const map = mapInstanceRef.current;
    if (map && boundsRef.current && boundsRef.current.isValid()) {
      map.fitBounds(boundsRef.current, { padding: [30, 30] });
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full z-0" />
      <button
        onClick={handleZoomToFit}
        title="Zoom to fit all features"
        className="absolute bottom-6 left-3 z-10 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow hover:bg-zinc-50"
      >
        ⛶ Zoom to Fit
      </button>
    </div>
  );
}
