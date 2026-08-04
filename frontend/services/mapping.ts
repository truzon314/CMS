import type { FeatureCollection } from "geojson";
import { apiFetch, getAccessToken } from "@/lib/api-client";
import type { LayerConfig, MapProviderConfig, MapProviderType, ProjectConfig, ShareLinkConfig, StyleRule } from "@/lib/layers";

// Wire shapes exactly as the FastAPI backend returns them (snake_case) —
// kept private to this file; every exported function below adapts to/from
// the camelCase LayerConfig/ProjectConfig/etc. shapes the existing
// map-management components (MapView, LayerSettingsPanel, ShareLinkModal...)
// were already built around, so this file is the one place the boundary
// gets crossed instead of every component learning a new wire format.
interface WireProject {
  id: string;
  name: string;
  map_provider_type: string;
  share_token: string | null;
}
interface WireLayer {
  id: string;
  project_id: string;
  label: string;
  stroke_color: string;
  fill_color: string;
  fill_opacity: number;
  stroke_weight: number;
  default_visible: boolean;
  color_rules: StyleRule[] | null;
  label_property: string | null;
  popup_enabled: boolean;
  popup_properties: string[] | null;
  stroke_style: "solid" | "dashed" | "dotted";
  geojson: FeatureCollection | null;
}
interface WireShareLink {
  id: string;
  project_id: string;
  token: string;
  is_active: boolean;
  has_password: boolean;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  created_at: string;
}
interface WireProviderConfig {
  provider_type: string;
  api_key: string | null;
  tile_url: string | null;
  style_url: string | null;
  attribution: string | null;
}

function toProjectConfig(p: WireProject): ProjectConfig {
  return { id: p.id, name: p.name, ownerId: null, shareToken: p.share_token ?? "", mapProviderType: p.map_provider_type };
}

function toLayerConfig(l: WireLayer): LayerConfig {
  return {
    id: l.id,
    label: l.label,
    projectId: l.project_id,
    strokeColor: l.stroke_color,
    fillColor: l.fill_color,
    fillOpacity: l.fill_opacity,
    strokeWeight: l.stroke_weight,
    defaultVisible: l.default_visible,
    colorRules: l.color_rules ?? undefined,
    labelProperty: l.label_property ?? undefined,
    popupEnabled: l.popup_enabled,
    popupProperties: l.popup_properties ?? undefined,
    strokeStyle: l.stroke_style,
  };
}

function toShareLinkConfig(s: WireShareLink): ShareLinkConfig {
  return {
    id: s.id,
    projectId: s.project_id,
    token: s.token,
    isActive: s.is_active,
    hasPassword: s.has_password,
    expiresAt: s.expires_at,
    maxViews: s.max_views,
    viewCount: s.view_count,
    createdAt: s.created_at,
  };
}

function toMapProviderConfig(p: WireProviderConfig): MapProviderConfig {
  return {
    providerType: p.provider_type as MapProviderType,
    apiKey: p.api_key,
    tileUrl: p.tile_url,
    styleUrl: p.style_url,
    attribution: p.attribution,
  };
}

export const mappingService = {
  listProjects: async (): Promise<ProjectConfig[]> => (await apiFetch<WireProject[]>("/api/v1/mapping/projects")).map(toProjectConfig),

  createProject: async (name: string, mapProviderType = "google"): Promise<ProjectConfig> =>
    toProjectConfig(
      await apiFetch<WireProject>("/api/v1/mapping/projects", {
        method: "POST",
        body: JSON.stringify({ name, map_provider_type: mapProviderType }),
      })
    ),

  updateProject: async (
    id: string,
    patch: { name?: string; mapProviderType?: string; rotateToken?: boolean }
  ): Promise<ProjectConfig> =>
    toProjectConfig(
      await apiFetch<WireProject>(`/api/v1/mapping/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: patch.name, map_provider_type: patch.mapProviderType, rotate_token: patch.rotateToken }),
      })
    ),

  deleteProject: (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/mapping/projects/${id}`, { method: "DELETE" }),

  listLayers: async (): Promise<LayerConfig[]> => (await apiFetch<WireLayer[]>("/api/v1/mapping/layers")).map(toLayerConfig),

  // Just the FeatureCollection — matches the old GET /api/layers/[id]
  // contract (raw geojson body), since every caller (useGeoJsonLayer,
  // OpenStreetMapCanvas, LayerSettingsPanel) only ever wants the features.
  getLayerGeoJson: async (id: string, shareToken?: string, sharePassword?: string | null): Promise<FeatureCollection> => {
    if (shareToken) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/public/mapping/${shareToken}/layers/${id}`,
        { headers: sharePassword ? { "x-share-password": sharePassword } : {} }
      );
      const envelope = await res.json();
      return envelope.data as FeatureCollection;
    }
    const layer = await apiFetch<WireLayer>(`/api/v1/mapping/layers/${id}`);
    return layer.geojson ?? { type: "FeatureCollection", features: [] };
  },

  uploadLayerGeoJson: async (projectId: string, label: string, geojson: FeatureCollection): Promise<LayerConfig> =>
    toLayerConfig(
      await apiFetch<WireLayer>("/api/v1/mapping/layers/upload", {
        method: "POST",
        body: JSON.stringify({ project_id: projectId, label, geojson }),
      })
    ),

  updateLayerStyle: async (
    id: string,
    patch: {
      strokeColor?: string;
      fillColor?: string;
      fillOpacity?: number;
      strokeWeight?: number;
      defaultVisible?: boolean;
      colorRules?: StyleRule[];
      labelProperty?: string;
      popupEnabled?: boolean;
      popupProperties?: string[];
      strokeStyle?: "solid" | "dashed" | "dotted";
    }
  ): Promise<LayerConfig> =>
    toLayerConfig(
      await apiFetch<WireLayer>(`/api/v1/mapping/layers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          stroke_color: patch.strokeColor,
          fill_color: patch.fillColor,
          fill_opacity: patch.fillOpacity,
          stroke_weight: patch.strokeWeight,
          default_visible: patch.defaultVisible,
          color_rules: patch.colorRules,
          label_property: patch.labelProperty,
          popup_enabled: patch.popupEnabled,
          popup_properties: patch.popupProperties,
          stroke_style: patch.strokeStyle,
        }),
      })
    ),

  deleteLayer: (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/mapping/layers/${id}`, { method: "DELETE" }),

  updateLayerFeatures: async (
    id: string,
    payload: {
      featureIndex?: number;
      properties?: Record<string, unknown>;
      batchUpdate?: { property: string; oldValue: string; newValue: string };
      addProperty?: { key: string; defaultValue?: string };
      removeProperty?: { key: string };
      bulkSetValue?: { property: string; value: string; featureIndices: number[] };
      removeFeatureIndices?: number[];
    }
  ): Promise<{
    ok: boolean;
    featureIndex?: number;
    updatedFeature?: unknown;
    updatedCount?: number;
    addedCount?: number;
    key?: string;
    removedCount?: number;
  }> => {
    const result = await apiFetch<{
      ok: boolean;
      feature_index?: number;
      updated_feature?: unknown;
      updated_count?: number;
      added_count?: number;
      key?: string;
      removed_count?: number;
    }>(`/api/v1/mapping/layers/${id}/features`, {
      method: "PUT",
      body: JSON.stringify({
        feature_index: payload.featureIndex,
        properties: payload.properties,
        batch_update: payload.batchUpdate
          ? { property: payload.batchUpdate.property, old_value: payload.batchUpdate.oldValue, new_value: payload.batchUpdate.newValue }
          : undefined,
        add_property: payload.addProperty
          ? { key: payload.addProperty.key, default_value: payload.addProperty.defaultValue ?? "" }
          : undefined,
        remove_property: payload.removeProperty ? { key: payload.removeProperty.key } : undefined,
        bulk_set_value: payload.bulkSetValue
          ? {
              property: payload.bulkSetValue.property,
              value: payload.bulkSetValue.value,
              feature_indices: payload.bulkSetValue.featureIndices,
            }
          : undefined,
        remove_feature_indices: payload.removeFeatureIndices,
      }),
    });
    return {
      ok: result.ok,
      featureIndex: result.feature_index,
      updatedFeature: result.updated_feature,
      updatedCount: result.updated_count,
      addedCount: result.added_count,
      key: result.key,
      removedCount: result.removed_count,
    };
  },

  getShareLink: async (projectId: string): Promise<ShareLinkConfig | null> => {
    const link = await apiFetch<WireShareLink | null>(`/api/v1/mapping/share-links?project_id=${projectId}`);
    return link ? toShareLinkConfig(link) : null;
  },

  upsertShareLink: async (payload: {
    projectId: string;
    isActive?: boolean;
    password?: string | null;
    expiresAt?: string | null;
    maxViews?: number | null;
    rotateToken?: boolean;
  }): Promise<ShareLinkConfig> =>
    toShareLinkConfig(
      await apiFetch<WireShareLink>("/api/v1/mapping/share-links", {
        method: "POST",
        body: JSON.stringify({
          project_id: payload.projectId,
          is_active: payload.isActive,
          password: payload.password,
          expires_at: payload.expiresAt,
          max_views: payload.maxViews,
          rotate_token: payload.rotateToken,
        }),
      })
    ),

  listProviders: async (): Promise<MapProviderConfig[]> =>
    (await apiFetch<WireProviderConfig[]>("/api/v1/mapping/providers")).map(toMapProviderConfig),

  // Consumed by MapView on load — the equivalent of the old /api/config.
  getGoogleMapsApiKey: async (): Promise<string | null> => {
    const providers = await apiFetch<WireProviderConfig[]>("/api/v1/mapping/providers");
    return providers.find((p) => p.provider_type === "google")?.api_key ?? null;
  },

  upsertProvider: async (payload: {
    providerType: string;
    apiKey?: string;
    tileUrl?: string;
    styleUrl?: string;
    attribution?: string;
  }): Promise<MapProviderConfig> =>
    toMapProviderConfig(
      await apiFetch<WireProviderConfig>("/api/v1/mapping/providers", {
        method: "POST",
        body: JSON.stringify({
          provider_type: payload.providerType,
          api_key: payload.apiKey,
          tile_url: payload.tileUrl,
          style_url: payload.styleUrl,
          attribution: payload.attribution,
        }),
      })
    ),

  getSharedProject: async (
    token: string,
    sharePassword?: string | null
  ): Promise<{ project: ProjectConfig; layers: LayerConfig[] }> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/public/mapping/${token}`, {
      headers: sharePassword ? { "x-share-password": sharePassword } : {},
    });
    const envelope = await res.json();
    if (!envelope.success) throw new Error(envelope.error?.message ?? "Failed to load shared project.");
    const data = envelope.data as { project: WireProject; layers: WireLayer[] };
    return { project: toProjectConfig(data.project), layers: data.layers.map(toLayerConfig) };
  },

  // Bearer token to attach when POSTing a file to the local /api/gis/upload
  // proxy (same-origin, so apiFetch's own Authorization header logic
  // doesn't apply — that helper is for direct backend calls only).
  getAuthHeader: (): Record<string, string> => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
