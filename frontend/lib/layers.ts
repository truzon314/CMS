// Types for the dynamic layer registry — real rows in the FastAPI backend's
// map_layer table, fetched via services/mapping.ts. Layers are created by
// uploading GeoJSON from the map-management admin UI.
export type StyleRule = {
  id: string;
  property: string;
  value: string;
  action: "color" | "hide";
  // Required when action is "color".
  color?: string;
  // Optional when action is "color"; falls back to the layer's base
  // fillOpacity when unset.
  opacity?: number;
};

export type LayerConfig = {
  id: string;
  label: string;
  projectId: string;
  strokeColor: string;
  fillColor: string;
  fillOpacity: number;
  strokeWeight: number;
  defaultVisible: boolean;
  // User-defined conditional styling ("show/hide or recolor features where
  // <property> = <value>"), edited from the Layer Settings panel. Evaluated
  // in order; the first matching rule wins.
  colorRules?: StyleRule[];
  // Which GeoJSON property to render as a text label directly on each
  // feature on the map itself (e.g. plot numbers) — not the popup. Unset
  // means no on-map labels for this layer.
  labelProperty?: string;
  // Whether clicking a feature on this layer opens the properties popup.
  // Unset is treated as enabled (existing layers predate this field).
  popupEnabled?: boolean;
  // Which GeoJSON properties are allowed to appear in that popup. Unset or
  // empty means no restriction — show every property the feature has
  // (the original, pre-this-field behavior).
  popupProperties?: string[];
  // Stroke pattern for line/border rendering. Only meaningful for
  // LineString/MultiLineString layers (e.g. roads) — polygons still use
  // this for their border, but the visual difference is subtle there.
  // Unset is treated as "solid".
  strokeStyle?: "solid" | "dashed" | "dotted";
};

export function isStyleRuleArray(value: unknown): value is StyleRule[] {
  return (
    Array.isArray(value) &&
    value.every((r) => {
      if (typeof r !== "object" || r === null) return false;
      const rule = r as Partial<StyleRule>;
      if (typeof rule.id !== "string" || typeof rule.property !== "string" || typeof rule.value !== "string") {
        return false;
      }
      if (rule.action !== "color" && rule.action !== "hide") return false;
      if (rule.action === "color" && typeof rule.color !== "string") return false;
      if (rule.opacity !== undefined && (typeof rule.opacity !== "number" || rule.opacity < 0 || rule.opacity > 1)) {
        return false;
      }
      return true;
    })
  );
}

// Fallback viewport before any layer has loaded — once a layer's data
// arrives, the map fits its bounds automatically (see MapView.tsx).
export const PROJECT_CENTER = { lat: 0, lng: 0 };
export const PROJECT_DEFAULT_ZOOM = 2;

export type ProjectConfig = {
  id: string;
  name: string;
  // No multi-tenant ownership anymore — every project is shared across the
  // one CMS workspace. Kept (always null) rather than removed so it doesn't
  // ripple through every component still typed against ProjectConfig.
  ownerId: string | null;
  shareToken: string;
  mapProviderType?: string;
};

// Auto-assigned to new layers on upload, rotating through by upload order.
export const LAYER_COLOR_PALETTE = [
  "#0EA5E9",
  "#22C55E",
  "#F97316",
  "#A855F7",
  "#EF4444",
  "#EAB308",
  "#14B8A6",
  "#EC4899",
  "#6366F1",
  "#84CC16",
];

// Minimum zoom level at which plot text labels become legible and fit
// inside polygons. Shared by both map renderers (MapView.tsx's Google Data
// layer and OpenStreetMapCanvas.tsx's Leaflet layer) so the threshold can't
// drift between them.
export const LABEL_MIN_ZOOM = 18;

// Grows labels as you zoom in past LABEL_MIN_ZOOM, instead of holding them
// at a fixed size — a label that's readable at 18 looks tiny by the time
// you're zoomed to 21+. +2.5px per zoom level, capped at 28px so it doesn't
// dominate the view at extreme zoom. Shared by both renderers, same reason
// as LABEL_MIN_ZOOM above.
export function fontSizeForZoom(zoom: number): number {
  const base = 10;
  const growth = Math.max(0, zoom - LABEL_MIN_ZOOM) * 2.5;
  return Math.min(base + growth, 28);
}

// A GeoJSON-style geometry shape, kept minimal here rather than importing
// the full `geojson` package's `Geometry` type — this only needs `type`
// and `coordinates`. `coordinates` is optional so this still structurally
// accepts GeometryCollection (which has `geometries` instead) without the
// caller having to narrow the union first; centroidOf just returns null
// for any shape it doesn't recognize below.
type SimpleGeometry = { type: string; coordinates?: any };

// Centroid of a feature's geometry, for placing an on-map text label.
// Points return their own coordinate; polygons average their outer ring
// (good enough for labeling — not a true area centroid, but neither
// renderer needs one). Returns null for geometry types/shapes it can't
// derive a single point from (e.g. an empty ring).
export function centroidOf(geometry: SimpleGeometry | null | undefined): { lat: number; lng: number } | null {
  if (!geometry) return null;
  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates;
    return { lat, lng };
  }
  let ring: number[][] | undefined;
  if (geometry.type === "Polygon") ring = geometry.coordinates[0];
  else if (geometry.type === "MultiPolygon") ring = geometry.coordinates[0]?.[0];
  if (!ring || ring.length === 0) return null;
  let sumLat = 0;
  let sumLng = 0;
  for (const [lng, lat] of ring) {
    sumLat += lat;
    sumLng += lng;
  }
  return { lat: sumLat / ring.length, lng: sumLng / ring.length };
}

// A feature's properties are restricted to layer.popupProperties when it's
// set and non-empty; unset/empty means no restriction (show everything).
// Precompute once per layer/render with this, then check each property key
// against it with isPropertyAllowed — avoids rebuilding a Set per key.
export function buildPropertyAllowlist(popupProperties: string[] | null | undefined): Set<string> | null {
  return popupProperties && popupProperties.length > 0 ? new Set(popupProperties) : null;
}

export function isPropertyAllowed(key: string, allowlist: Set<string> | null): boolean {
  return allowlist === null || allowlist.has(key);
}

// Auth header for fetching a layer's GeoJSON on the public share-link view
// (admin requests carry the CMS's own bearer token via apiFetch and need no
// header of their own).
export function shareHeaders(sharePassword?: string | null): Record<string, string> {
  return sharePassword ? { "x-share-password": sharePassword } : {};
}

export type ShareLinkConfig = {
  id: string;
  projectId: string;
  token: string;
  isActive: boolean;
  hasPassword: boolean;
  expiresAt?: string | null;
  maxViews?: number | null;
  viewCount: number;
  createdAt: string;
};

export type MapProviderType = "google" | "google_satellite" | "mapbox" | "gee" | "osm" | "custom" | "xyz";

export type MapProviderConfig = {
  providerType: MapProviderType;
  apiKey?: string | null;
  tileUrl?: string | null;
  styleUrl?: string | null;
  attribution?: string | null;
};
