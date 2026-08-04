"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { GoogleMap, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import type { Feature, FeatureCollection } from "geojson";
import {
  PROJECT_CENTER,
  PROJECT_DEFAULT_ZOOM,
  LABEL_MIN_ZOOM,
  centroidOf,
  fontSizeForZoom,
  type LayerConfig,
  type ProjectConfig,
  type StyleRule,
} from "@/lib/layers";
import { mappingService } from "@/services/mapping";
import { FeaturePopup } from "@/modules/mapping/FeaturePopup";
import LayerSettingsPanel, {
  type LayerPatch,
} from "@/modules/mapping/LayerSettingsPanel";
import CreateProjectModal from "@/modules/mapping/CreateProjectModal";
import GisUploadModal from "@/modules/mapping/GisUploadModal";
import MapProviderModal from "@/modules/mapping/MapProviderModal";
import ShareLinkModal from "@/modules/mapping/ShareLinkModal";
import ApiEmbedModal from "@/modules/mapping/ApiEmbedModal";
import FeatureAttributeEditorModal from "@/modules/mapping/FeatureAttributeEditorModal";
import ProjectSwitcherModal from "@/modules/mapping/ProjectSwitcherModal";
import Breadcrumbs from "@/modules/mapping/Breadcrumbs";
import CommandPaletteModal, { type CommandItem } from "@/modules/mapping/CommandPaletteModal";
import { useWorkspaceState } from "@/modules/mapping/useWorkspaceState";

// Leaflet touches `window` at module load time, so it can never be part of
// the server bundle — even inside a "use client" component, Next.js still
// evaluates that component's imports during SSR for the initial HTML.
// ssr: false keeps the import out of the server bundle entirely.
const OpenStreetMapCanvas = dynamic(
  () => import("@/modules/mapping/OpenStreetMapCanvas"),
  { ssr: false },
);

type FeatureClickHandler = (
  layer: LayerConfig,
  props: Record<string, unknown>,
  position: google.maps.LatLngLiteral,
) => void;

type MapProject = ProjectConfig;

type MapViewProps =
  | { mode: "admin" }
  | { mode: "shared"; shareToken: string; sharePassword?: string | null };

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

type MapTypeId = "roadmap" | "satellite" | "hybrid" | "terrain";

const MAP_TYPES: { id: MapTypeId; label: string }[] = [
  { id: "roadmap", label: "Map" },
  { id: "satellite", label: "Satellite" },
  { id: "hybrid", label: "Hybrid" },
  { id: "terrain", label: "Terrain" },
];

// Note: layer.strokeStyle (solid/dashed/dotted) is intentionally not
// applied here. google.maps.Data.StyleOptions has no dash-pattern
// equivalent — Google only supports dashed lines via Polyline's `icons`
// (a repeating symbol along the path), which doesn't apply to Data-layer
// features. The OpenStreetMap/Leaflet renderer (OpenStreetMapCanvas.tsx)
// supports it natively via dashArray and is where it actually renders.
function dataStyleFor(layer: LayerConfig): google.maps.Data.StylingFunction {
  const propertiesInOrder: string[] = [];
  const byProperty = new Map<
    string,
    Map<string, { rule: StyleRule; index: number }>
  >();
  (layer.colorRules ?? []).forEach((rule, index) => {
    let byValue = byProperty.get(rule.property);
    if (!byValue) {
      byValue = new Map();
      byProperty.set(rule.property, byValue);
      propertiesInOrder.push(rule.property);
    }
    if (!byValue.has(rule.value)) byValue.set(rule.value, { rule, index });
  });

  return (feature) => {
    const base: google.maps.Data.StyleOptions = {
      strokeColor: layer.strokeColor,
      strokeWeight: layer.strokeWeight,
      fillColor: layer.fillColor,
      fillOpacity: layer.fillOpacity,
    };

    let best: { rule: StyleRule; index: number } | null = null;
    for (const property of propertiesInOrder) {
      const actual = feature.getProperty(property);
      if (actual === undefined || actual === null) continue;
      const candidate = byProperty.get(property)!.get(String(actual));
      if (candidate && (best === null || candidate.index < best.index))
        best = candidate;
    }
    if (!best) return base;

    const { rule } = best;
    if (rule.action === "hide") return { ...base, visible: false };
    return {
      ...base,
      fillColor: rule.color,
      strokeColor: rule.color,
      fillOpacity: rule.opacity ?? layer.fillOpacity,
    };
  };
}

function useGeoJsonLayer(
  map: google.maps.Map | null,
  layer: LayerConfig,
  visible: boolean,
  onFeatureClick: FeatureClickHandler,
  projectBoundsRef: React.MutableRefObject<google.maps.LatLngBounds | null>,
  selectedProjectId: string | null,
  shareToken?: string,
  sharePassword?: string | null,
) {
  const dataRef = useRef<google.maps.Data | null>(null);
  const labelMarkersRef = useRef<{ marker: google.maps.Marker; text: string }[]>([]);
  const lastFittedProjectIdRef = useRef<string | null>(null);
  // Read (not a dependency) by the label-marker effect below, so toggling
  // visibility doesn't rebuild every label marker — the separate effect
  // right after the data-fetch one already cheaply shows/hides the
  // existing markers via setMap(). Assigned during render, not in an
  // effect, so it's always current by the time any effect below runs.
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    if (!map) return;

    let cancelled = false;
    const data = new google.maps.Data();
    dataRef.current = data;
    data.setStyle(dataStyleFor(layer));
    data.setMap(visible ? map : null);

    const listener = data.addListener(
      "click",
      (e: google.maps.Data.MouseEvent) => {
        if (layer.popupEnabled === false) return;
        if (!e.latLng) return;
        const props: Record<string, unknown> = {};
        e.feature.forEachProperty((value, name) => {
          props[name] = value;
        });
        onFeatureClick(layer, props, e.latLng.toJSON());
      },
    );

    mappingService
      .getLayerGeoJson(layer.id, shareToken, sharePassword)
      .then((geojson: FeatureCollection) => {
        if (cancelled || !geojson || !Array.isArray(geojson.features)) return;
        data.addGeoJson(geojson);
        setFeatures(geojson.features as Feature[]);

        if (geojson.features.length > 0) {
          if (!projectBoundsRef.current) {
            projectBoundsRef.current = new google.maps.LatLngBounds();
          }
          data.forEach((f) =>
            f
              .getGeometry()
              ?.forEachLatLng((ll) => projectBoundsRef.current!.extend(ll)),
          );
          if (lastFittedProjectIdRef.current !== selectedProjectId) {
            map.fitBounds(projectBoundsRef.current, {
              top: 60,
              right: 280,
              bottom: 30,
              left: 30,
            });
            lastFittedProjectIdRef.current = selectedProjectId;
          }
        }
      })
      .catch((err) => console.error(`Failed to load layer ${layer.id}`, err));

    return () => {
      cancelled = true;
      if (listener && typeof listener.remove === "function") {
        listener.remove();
      } else if (
        listener &&
        typeof google !== "undefined" &&
        google.maps?.event?.removeListener
      ) {
        google.maps.event.removeListener(listener);
      }
      data.setMap(null);
      dataRef.current = null;
      setFeatures([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layer.id, selectedProjectId]);

  useEffect(() => {
    dataRef.current?.setMap(visible ? map : null);
    labelMarkersRef.current.forEach(({ marker }) => marker.setMap(visible ? map : null));
  }, [visible, map]);

  const rulesKey = JSON.stringify(layer.colorRules ?? []);
  useEffect(() => {
    dataRef.current?.setStyle(dataStyleFor(layer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    layer.strokeColor,
    layer.fillColor,
    layer.fillOpacity,
    layer.strokeWeight,
    rulesKey,
  ]);

  useEffect(() => {
    labelMarkersRef.current.forEach(({ marker }) => marker.setMap(null));

    if (!map || !layer.labelProperty) {
      labelMarkersRef.current = [];
      return;
    }

    const property = layer.labelProperty;
    const initialFontSize = fontSizeForZoom(map.getZoom() ?? LABEL_MIN_ZOOM);
    const markers = features
      .map((feature) => {
        const position = centroidOf(feature.geometry);
        const text = feature.properties?.[property];
        if (!position || text == null) return null;

        const shouldShow =
          visibleRef.current && (map.getZoom() ?? 0) >= LABEL_MIN_ZOOM;
        const labelText = String(text);
        const marker = new google.maps.Marker({
          position,
          map: shouldShow ? map : null,
          clickable: false,
          // Empty path = invisible marker; we only want its text label,
          // not a visible pin (kept inline since it's used only here).
          icon: { path: "M 0 0", strokeOpacity: 0, fillOpacity: 0 },
          label: {
            text: labelText,
            color: "#0f172a",
            fontSize: `${initialFontSize}px`,
            fontWeight: "700",
          },
        });
        return { marker, text: labelText };
      })
      .filter((m): m is { marker: google.maps.Marker; text: string } => m !== null);

    labelMarkersRef.current = markers;

    // Toggle label visibility when the user zooms in/out, and grow the
    // label text alongside — Marker.setLabel() needs the whole label
    // object each time, so the text is rebuilt from the tracked string
    // rather than round-tripped through getLabel() (which can also return
    // a plain string, not just the label object, per its own typings).
    const zoomListener = map.addListener("zoom_changed", () => {
      const zoom = map.getZoom() ?? 0;
      const show = visibleRef.current && zoom >= LABEL_MIN_ZOOM;
      const fontSize = fontSizeForZoom(zoom);
      for (const { marker, text } of labelMarkersRef.current) {
        marker.setMap(show ? map : null);
        marker.setLabel({ text, color: "#0f172a", fontSize: `${fontSize}px`, fontWeight: "700" });
      }
    });

    return () => {
      if (zoomListener && typeof zoomListener.remove === "function") {
        zoomListener.remove();
      } else if (
        zoomListener &&
        typeof google !== "undefined" &&
        google.maps?.event?.removeListener
      ) {
        google.maps.event.removeListener(zoomListener);
      }
      labelMarkersRef.current.forEach(({ marker }) => marker.setMap(null));
    };
    // visible intentionally omitted — read via visibleRef instead, so
    // toggling it doesn't rebuild every label marker (see visibleRef above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features, layer.labelProperty, map]);
}

function LayerLoader({
  map,
  layer,
  visible,
  onFeatureClick,
  projectBoundsRef,
  selectedProjectId,
  shareToken,
  sharePassword,
}: {
  map: google.maps.Map | null;
  layer: LayerConfig;
  visible: boolean;
  onFeatureClick: FeatureClickHandler;
  projectBoundsRef: React.MutableRefObject<google.maps.LatLngBounds | null>;
  selectedProjectId: string | null;
  shareToken?: string;
  sharePassword?: string | null;
}) {
  useGeoJsonLayer(
    map,
    layer,
    visible,
    onFeatureClick,
    projectBoundsRef,
    selectedProjectId,
    shareToken,
    sharePassword,
  );
  return null;
}

export default function MapView(props: MapViewProps) {
  const [apiKey, setApiKey] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    mappingService
      .getGoogleMapsApiKey()
      .then((key) => setApiKey(key))
      .catch(() => setApiKey(null));
  }, []);

  if (apiKey === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Loading configuration…</p>
      </div>
    );
  }

  return <MapCanvas apiKey={apiKey || ""} {...props} />;
}

function MapCanvas({ apiKey, ...props }: { apiKey: string } & MapViewProps) {
  const { mode } = props;
  const shareToken = props.mode === "shared" ? props.shareToken : undefined;
  const sharePassword =
    props.mode === "shared" ? props.sharePassword : undefined;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "dummy-key",
  });

  const [authFailed, setAuthFailed] = useState(false);
  useEffect(() => {
    const win = window as typeof window & { gm_authFailure?: () => void };
    win.gm_authFailure = () => {
      setAuthFailed(true);
    };

    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("Google Maps JavaScript API error")
      )
        return;
      originalConsoleError(...args);
    };

    return () => {
      delete win.gm_authFailure;
      console.error = originalConsoleError;
    };
  }, []);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapTypeId, setMapTypeId] = useState<MapTypeId>("hybrid");
  const [layers, setLayers] = useState<LayerConfig[]>([]);
  const [projects, setProjects] = useState<MapProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [settingsLayerId, setSettingsLayerId] = useState<string | null>(null);
  // from/over only ever change together during a drag, so one state
  // object instead of two keeps them from getting out of sync with each
  // other (and halves the setState calls in the handlers below).
  const [dragState, setDragState] = useState<{
    from: number;
    over: number;
  } | null>(null);

  // Bumped every time the user explicitly clicks a project tab — even
  // re-clicking the same one should re-centre the map.
  const [zoomEpoch, setZoomEpoch] = useState(0);

  // Shared across every layer of the selected project so each layer
  // extends a single LatLngBounds and the map auto-fits to the combined
  // extent. Reset to null when the project switches.
  const projectBoundsRef = useRef<google.maps.LatLngBounds | null>(null);
  useEffect(() => {
    projectBoundsRef.current = null;
  }, [selectedProjectId]);

  // When the user re-clicks the same project tab, re-fit the map to
  // the already-computed bounds without re-fetching anything.
  useEffect(() => {
    if (zoomEpoch === 0) return; // skip the initial mount
    if (
      map &&
      projectBoundsRef.current &&
      !projectBoundsRef.current.isEmpty()
    ) {
      map.fitBounds(projectBoundsRef.current, {
        top: 60,
        right: 280,
        bottom: 30,
        left: 30,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomEpoch]);

  // Modal states
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showGisUpload, setShowGisUpload] = useState(false);
  const [showMapProvider, setShowMapProvider] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showApiEmbedModal, setShowApiEmbedModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [editingFeature, setEditingFeature] = useState<{
    layer: LayerConfig;
    props: Record<string, unknown>;
  } | null>(null);

  const { pinnedIds, recentIds, togglePin, addRecent } = useWorkspaceState();

  const [selected, setSelected] = useState<{
    layer: LayerConfig;
    props: Record<string, unknown>;
    position: google.maps.LatLngLiteral;
  } | null>(null);

  const refreshLayers = useCallback(() => {
    if (mode === "admin") {
      mappingService
        .listLayers()
        .then((layers) => setLayers(layers))
        .catch((err) => console.error("Failed to load layers", err));
    } else if (shareToken) {
      mappingService
        .getSharedProject(shareToken, sharePassword)
        .then(({ project, layers }) => {
          setLayers(layers);
          setProjects([project]);
          setSelectedProjectId(project.id);
        })
        .catch((err) => console.error("Failed to load shared project", err));
    }
  }, [mode, shareToken, sharePassword]);

  useEffect(() => {
    refreshLayers();
  }, [refreshLayers]);

  const refreshProjects = useCallback(() => {
    if (mode !== "admin") return;
    mappingService
      .listProjects()
      .then((projects) => {
        setProjects(projects);
        setSelectedProjectId((current) => current ?? projects[0]?.id ?? null);
      })
      .catch((err) => console.error("Failed to load projects", err));
  }, [mode]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleDeleteProject = useCallback(
    async (id: string) => {
      try {
        await mappingService.deleteProject(id);
        setProjects((current) => {
          const next = current.filter((p) => p.id !== id);
          if (selectedProjectId === id) {
            setSelectedProjectId(next[0]?.id ?? null);
          }
          return next;
        });
      } catch (err) {
        console.error("Failed to delete project", err);
        alert("Failed to delete project. Please try again.");
      }
    },
    [selectedProjectId],
  );

  const handleCreateProject = useCallback(async (name: string) => {
    const project = await mappingService.createProject(name);
    setProjects((current) => [...current, project]);
    setSelectedProjectId(project.id);
    setZoomEpoch((e) => e + 1);
  }, []);

  // Memoized: without this, every layer of the selected project got a new
  // array on every render (e.g. from unrelated drag-hover state changes),
  // which in turn defeated commandItems' own memoization below.
  const projectLayers = useMemo(
    () => layers.filter((l) => l.projectId === selectedProjectId),
    [layers, selectedProjectId],
  );
  const activeProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;

  // "Google Satellite" starts each project on pure satellite imagery
  // instead of the usual hybrid (satellite + road labels) view — same
  // underlying Google Maps JS API and key as the default provider, just a
  // different starting basemap. The Map/Satellite/Hybrid/Terrain toggle
  // still lets admins switch freely afterward either way.
  useEffect(() => {
    setMapTypeId(
      activeProject?.mapProviderType === "google_satellite"
        ? "satellite"
        : "hybrid",
    );
  }, [activeProject?.mapProviderType, selectedProjectId]);

  const toggleLayer = useCallback(
    (id: string) =>
      setVisibility((v) => {
        const layerDefault =
          layers.find((l) => l.id === id)?.defaultVisible ?? true;
        return { ...v, [id]: !(v[id] ?? layerDefault) };
      }),
    [layers],
  );

  // Memoized: this list feeds the command palette's own search filtering
  // (CommandPaletteModal.tsx), which memoizes on this array's identity —
  // rebuilding it (with fresh onSelect closures) on every MapCanvas render
  // defeated that.
  const commandItems: CommandItem[] = useMemo(
    () => [
      ...projects.map((p) => ({
        id: `project-${p.id}`,
        title: p.name,
        category: "Projects" as const,
        subtitle: `Switch active project view`,
        onSelect: () => {
          setSelectedProjectId(p.id);
          addRecent(p.id);
          setZoomEpoch((e) => e + 1);
        },
      })),
      ...projectLayers.map((l) => ({
        id: `layer-${l.id}`,
        title: l.label,
        category: "Layers" as const,
        subtitle: `Toggle visibility (${(visibility[l.id] ?? l.defaultVisible) ? "Visible" : "Hidden"})`,
        onSelect: () => toggleLayer(l.id),
      })),
      {
        id: "action-upload",
        title: "Upload GIS File (Shapefile / GeoJSON / ZIP)",
        category: "Actions" as const,
        onSelect: () => setShowGisUpload(true),
      },
      {
        id: "action-share",
        title: "Generate Public Share Link",
        category: "Actions" as const,
        onSelect: () => setShowShareModal(true),
      },
      {
        id: "action-api",
        title: "View REST APIs & iFrame Embed Code",
        category: "Actions" as const,
        onSelect: () => setShowApiEmbedModal(true),
      },
      {
        id: "action-provider",
        title: "Configure Map Provider (Mapbox, GEE, OSM, Google)",
        category: "Providers" as const,
        onSelect: () => setShowMapProvider(true),
      },
    ],
    [projects, projectLayers, visibility, toggleLayer, addRecent],
  );

  const useOpenStreetMap =
    authFailed ||
    activeProject?.mapProviderType === "osm" ||
    activeProject?.mapProviderType === "mapbox" ||
    activeProject?.mapProviderType === "xyz" ||
    activeProject?.mapProviderType === "custom" ||
    !apiKey;

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const handleZoomToFit = useCallback(() => {
    if (map && projectBoundsRef.current && !projectBoundsRef.current.isEmpty()) {
      map.fitBounds(projectBoundsRef.current, {
        top: 60,
        right: 280,
        bottom: 30,
        left: 30,
      });
    }
  }, [map]);

  const handleFeatureClick = useCallback<FeatureClickHandler>(
    (layer, props, position) => {
      setSelected({ layer, props, position });
    },
    [],
  );

  const handleSaveLayerSettings = useCallback(
    async (layerId: string, patch: LayerPatch) => {
      const updated = await mappingService.updateLayerStyle(layerId, patch);
      setLayers((current) =>
        current.map((l) => (l.id === layerId ? updated : l)),
      );
    },
    [],
  );

  const handleDeleteLayer = useCallback(async (layerId: string) => {
    if (
      !window.confirm(
        `Remove layer"${layerId}"? This deletes its uploaded data.`,
      )
    )
      return;
    await mappingService.deleteLayer(layerId);
    setLayers((current) => current.filter((l) => l.id !== layerId));
  }, []);

  const handleMoveLayer = useCallback(
    (layerId: string, direction: "up" | "down") => {
      setLayers((current) => {
        const idx = current.findIndex((l) => l.id === layerId);
        if (idx === -1) return current;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= current.length) return current;
        const copy = [...current];
        const [item] = copy.splice(idx, 1);
        copy.splice(targetIdx, 0, item);
        return copy;
      });
    },
    [],
  );

  const handleDropLayer = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === null || toIndex === null || fromIndex === toIndex)
        return;
      setLayers((current) => {
        const pLayers = current.filter(
          (l) => l.projectId === selectedProjectId,
        );
        if (fromIndex >= pLayers.length || toIndex >= pLayers.length)
          return current;
        const moving = pLayers[fromIndex];
        const target = pLayers[toIndex];
        const copy = [...current];
        const realFrom = copy.findIndex((l) => l.id === moving.id);
        const realTo = copy.findIndex((l) => l.id === target.id);
        if (realFrom === -1 || realTo === -1) return current;
        const [moved] = copy.splice(realFrom, 1);
        copy.splice(realTo, 0, moved);
        return copy;
      });
    },
    [selectedProjectId],
  );

  const settingsLayer = layers.find((l) => l.id === settingsLayerId) ?? null;

  return (
    <div className="relative h-full w-full">
      {/* If Google Maps failed or OSM/Mapbox selected, use OpenStreetMap Canvas */}
      {useOpenStreetMap ? (
        <OpenStreetMapCanvas
          layers={projectLayers}
          selectedProjectId={selectedProjectId}
          mode={mode}
          visibility={visibility}
          shareToken={shareToken}
          sharePassword={sharePassword}
        />
      ) : isLoaded ? (
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={PROJECT_CENTER}
          zoom={PROJECT_DEFAULT_ZOOM}
          mapTypeId={mapTypeId}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            fullscreenControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            tilt: 0,
          }}
        >
          {projectLayers.map((layer) => (
            <LayerLoader
              key={layer.id}
              map={map}
              layer={layer}
              visible={visibility[layer.id] ?? layer.defaultVisible}
              onFeatureClick={handleFeatureClick}
              projectBoundsRef={projectBoundsRef}
              selectedProjectId={selectedProjectId}
              shareToken={shareToken}
              sharePassword={sharePassword}
            />
          ))}

          {selected && (
            <InfoWindow
              position={selected.position}
              onCloseClick={() => setSelected(null)}
            >
              <FeaturePopup
                layer={selected.layer}
                props={selected.props}
                position={selected.position}
                onEdit={
                  mode === "admin"
                    ? () =>
                        setEditingFeature({
                          layer: selected.layer,
                          props: selected.props,
                        })
                    : undefined
                }
              />
            </InfoWindow>
          )}
        </GoogleMap>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-100">
          <p className="text-zinc-500">Loading map canvas...</p>
        </div>
      )}

      {!useOpenStreetMap && isLoaded && (
        <button
          onClick={handleZoomToFit}
          title="Zoom to fit all features"
          // bottom-10 (not bottom-6, matching the OSM canvas button) to
          // clear Google's own logo watermark, which sits bottom-left too.
          className="absolute bottom-10 left-3 z-10 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow hover:bg-zinc-50"
        >
          ⛶ Zoom to Fit
        </button>
      )}

      {/* Notice bar when fallback OpenStreetMap is active due to Google Key rejection */}
      {authFailed && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 shadow-md text-xs text-amber-900">
          <span>
            ⚠️ Google Maps API Key issue. Currently rendering via{" "}
            <strong>OpenStreetMap Tiles</strong>.
          </span>
          {mode === "admin" && (
            <button
              onClick={() => setShowMapProvider(true)}
              className="ml-2 font-bold underline hover:text-amber-950"
            >
              Configure Provider / Key →
            </button>
          )}
        </div>
      )}

      {/* Enterprise Workspace Header & Navigation */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-3 z-10 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Basemap toggle (Google Maps) */}
          {!useOpenStreetMap && (
            <div className="flex overflow-hidden rounded-md border border-zinc-300 bg-white shadow">
              {MAP_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMapTypeId(t.id)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    mapTypeId === t.id
                      ? "bg-blue-600 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Breadcrumb path */}
          <div className="hidden md:flex rounded-md border border-zinc-300 bg-white/95 px-3 py-1.5 shadow">
            <Breadcrumbs
              projectName={activeProject?.name}
              activeLayerName={
                projectLayers.find((l) => visibility[l.id] ?? l.defaultVisible)
                  ?.label
              }
            />
          </div>
        </div>

        {/* Project Switcher & Toolbar Actions (Admin Mode) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {mode === "admin" && (
            <button
              onClick={() => setShowCreateProject(true)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 shadow hover:bg-blue-50"
              title="Create a new project"
            >
              + New Project
            </button>
          )}

          {projects.length > 0 && (
            <ProjectSwitcherModal
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                addRecent(id);
                setZoomEpoch((e) => e + 1);
              }}
              pinnedIds={pinnedIds}
              recentIds={recentIds}
              onTogglePin={togglePin}
              onOpenCommandPalette={() => setShowCommandPalette(true)}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {mode === "admin" && selectedProjectId && (
            <div className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white/95 p-1 shadow">
              <button
                onClick={() => setShowGisUpload(true)}
                className="rounded px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                title="Upload Shapefile / GeoJSON / ZIP"
              >
                + Upload GIS
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="rounded px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                title="Generate & Manage Public Share Link"
              >
                🔗 Share Link
              </button>
              <button
                onClick={() => setShowApiEmbedModal(true)}
                className="rounded px-2.5 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50"
                title="Public & Admin REST APIs and Embed Code"
              >
                ⚡ API & Embed
              </button>
              <button
                onClick={() => setShowMapProvider(true)}
                className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                title="Configure Map Providers"
              >
                🗺️ Provider
              </button>
              <button
                onClick={() => setShowCommandPalette(true)}
                className="rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
                title="Open Command Palette (⌘K)"
              >
                🔍 ⌘K
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Layer Controls Panel (Adjusted top and bottom bounds with layer reordering) */}
      {mode === "admin" && (
        <div className="absolute top-14 bottom-6 right-3 w-72 max-h-[calc(100vh-6rem)] rounded-xl border border-zinc-300 bg-white/95 p-3 shadow-xl z-10 flex flex-col">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-100 shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-800">
                Layers ({projectLayers.length})
              </p>
              <p className="text-[10px] text-zinc-400">
                Order: Top layer renders on top
              </p>
            </div>
            <button
              onClick={() => setShowGisUpload(true)}
              className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
            >
              + Add Layer
            </button>
          </div>

          {projectLayers.length === 0 && (
            <p className="text-xs text-zinc-400 p-2 text-center">
              No layers in this project. Click &quot;+ Add Layer&quot; above to
              drag & drop shapefiles or GeoJSON.
            </p>
          )}

          <ul className="space-y-1.5 overflow-y-auto flex-1 pr-1">
            {projectLayers.map((layer, index) => {
              const isDragging = dragState?.from === index;
              const isDragOver = dragState?.over === index;

              return (
                <li
                  key={layer.id}
                  draggable
                  onDragStart={(e) => {
                    setDragState({ from: index, over: index });
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragState((s) => (s ? { ...s, over: index } : null));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragState) {
                      handleDropLayer(dragState.from, index);
                    }
                    setDragState(null);
                  }}
                  onDragEnd={() => {
                    setDragState(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border p-1.5 text-xs transition-all ${
                    isDragging
                      ? "opacity-40 border-dashed border-blue-500 bg-blue-50"
                      : isDragOver
                        ? "border-blue-500 bg-blue-50/80 scale-[1.02]"
                        : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300"
                  }`}
                >
                  {/* Drag Handle Icon */}
                  <span
                    className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 text-xs px-0.5 select-none"
                    title="Drag to reorder layer"
                  >
                    ⠿
                  </span>

                  {/* Layer order adjustment buttons (Up / Down) */}
                  <div className="flex flex-col shrink-0">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveLayer(layer.id, "up")}
                      title="Move layer up (draw on top)"
                      className="text-[9px] leading-tight text-zinc-400 hover:text-zinc-800 disabled:opacity-20"
                    >
                      ▲
                    </button>
                    <button
                      disabled={index === projectLayers.length - 1}
                      onClick={() => handleMoveLayer(layer.id, "down")}
                      title="Move layer down (draw underneath)"
                      className="text-[9px] leading-tight text-zinc-400 hover:text-zinc-800 disabled:opacity-20"
                    >
                      ▼
                    </button>
                  </div>

                  <input
                    type="checkbox"
                    checked={visibility[layer.id] ?? layer.defaultVisible}
                    onChange={() => toggleLayer(layer.id)}
                    className="accent-blue-600 shrink-0"
                    id={`layer-${layer.id}`}
                  />

                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-sm border border-black/10"
                    style={{ backgroundColor: layer.fillColor }}
                  />

                  <label
                    htmlFor={`layer-${layer.id}`}
                    className="min-w-0 flex-1 truncate font-medium text-zinc-800 cursor-grab"
                  >
                    {layer.label}
                  </label>

                  <button
                    onClick={() => setSettingsLayerId(layer.id)}
                    title="Layer style & label settings"
                    className="shrink-0 rounded p-1 text-xs text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                  >
                    ⚙
                  </button>
                  <button
                    onClick={() => handleDeleteLayer(layer.id)}
                    title="Remove layer"
                    className="shrink-0 rounded p-1 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {mode === "admin" && settingsLayer && (
        <LayerSettingsPanel
          layer={settingsLayer}
          onClose={() => setSettingsLayerId(null)}
          onSave={(patch) => handleSaveLayerSettings(settingsLayer.id, patch)}
        />
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreate={handleCreateProject}
      />

      {selectedProjectId && (
        <>
          <GisUploadModal
            projectId={selectedProjectId}
            isOpen={showGisUpload}
            onClose={() => setShowGisUpload(false)}
            onSuccess={refreshLayers}
          />

          <MapProviderModal
            projectId={selectedProjectId}
            currentProvider={activeProject?.mapProviderType || "google"}
            isOpen={showMapProvider}
            onClose={() => setShowMapProvider(false)}
            onUpdate={() => {
              refreshLayers();
              refreshProjects();
            }}
          />

          {activeProject && (
            <>
              <ShareLinkModal
                project={activeProject as any}
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
              />

              <ApiEmbedModal
                project={activeProject as any}
                layers={projectLayers}
                isOpen={showApiEmbedModal}
                onClose={() => setShowApiEmbedModal(false)}
              />
            </>
          )}

          <CommandPaletteModal
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            items={commandItems}
          />

          {editingFeature && (
            <FeatureAttributeEditorModal
              layer={editingFeature.layer}
              initialProperties={editingFeature.props}
              isOpen={Boolean(editingFeature)}
              onClose={() => setEditingFeature(null)}
              onSaved={(updated) => {
                if (selected) {
                  setSelected({ ...selected, props: updated });
                }
                // Refresh layers to reflect changes in style & label rules live
                refreshLayers();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
