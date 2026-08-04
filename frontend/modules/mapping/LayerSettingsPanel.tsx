"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  LAYER_COLOR_PALETTE,
  type LayerConfig,
  type StyleRule,
} from "@/lib/layers";
import { mappingService } from "@/services/mapping";

const MAX_CATEGORY_VALUES = 30;

// Memoized so it only re-renders when the rules themselves (or the
// callbacks, which are stable via useCallback below) change — not on every
// keystroke elsewhere in the panel (e.g. the plot search box). Matters once
// a layer has accumulated a lot of individual-plot overrides, since without
// this every keystroke was re-rendering the whole list.
const RulesList = memo(function RulesList({
  rules,
  fillOpacity,
  onColorChange,
  onOpacityChange,
  onRemove,
}: {
  rules: StyleRule[];
  fillOpacity: number;
  onColorChange: (id: string, color: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onRemove: (id: string) => void;
}) {
  if (rules.length === 0) return null;
  return (
    <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-2 py-1 text-xs"
        >
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium text-zinc-400">{rule.property}</span>
            <span className="mx-1 text-zinc-300">=</span>
            <span className="font-medium text-zinc-800">{rule.value}</span>
            {rule.action === "hide" && (
              <span className="ml-1 text-zinc-400">(hidden)</span>
            )}
          </span>
          {rule.action === "color" && (
            <>
              <input
                type="color"
                value={rule.color}
                onChange={(e) => onColorChange(rule.id, e.target.value)}
                className="h-6 w-8 shrink-0 rounded border border-zinc-300"
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={rule.opacity ?? fillOpacity}
                onChange={(e) =>
                  onOpacityChange(rule.id, Number(e.target.value))
                }
                title={`Opacity: ${Math.round((rule.opacity ?? fillOpacity) * 100)}%`}
                className="w-14 shrink-0"
              />
            </>
          )}
          <button
            onClick={() => onRemove(rule.id)}
            className="shrink-0 text-red-500 hover:text-red-700"
          >
            remove
          </button>
        </li>
      ))}
    </ul>
  );
});

function newRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function distinctValues(
  features: { properties?: Record<string, unknown> | null }[],
  property: string,
): string[] {
  const set = new Set<string>();
  for (const feature of features) {
    const value = feature.properties?.[property];
    if (value !== undefined && value !== null && value !== "")
      set.add(String(value));
  }
  return Array.from(set).sort();
}

// Same fallback chain used for the "Select Feature / Plot" dropdown options
// and the batch/individual editor's plot labels — keeps them showing the
// same name for the same feature everywhere in this panel.
function featureLabel(
  feature: { properties?: Record<string, unknown> | null },
  idx: number,
): string {
  const props = feature.properties;
  const label = props?.Plot || props?.name || props?.label || props?.fid;
  return label != null ? String(label) : `Feature #${idx + 1}`;
}

export type LayerPatch = {
  labelProperty?: string;
  colorRules?: StyleRule[];
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  popupEnabled?: boolean;
  popupProperties?: string[];
  strokeStyle?: "solid" | "dashed" | "dotted";
};

const LINE_GEOMETRY_TYPES = new Set(["LineString", "MultiLineString"]);

// Layer configuration panel with three sections: which property to render
// as a text label directly on each feature on the map, per-value category
// coloring generated straight from the layer's own data (e.g. a "Status"
// property with Available/Sold/... each getting a color in one click), and
// the layer's base fill color/opacity used when no rule matches.
export default function LayerSettingsPanel({
  layer,
  onClose,
  onSave,
}: {
  layer: LayerConfig;
  onClose: () => void;
  onSave: (patch: LayerPatch) => Promise<void>;
}) {
  const [properties, setProperties] = useState<string[]>([]);
  const [propertiesLoaded, setPropertiesLoaded] = useState(false);
  const [featureCache, setFeatureCache] = useState<
    {
      properties?: Record<string, unknown> | null;
      geometry?: { type?: string };
    }[]
  >([]);
  const [isLineLayer, setIsLineLayer] = useState(false);

  const [labelProperty, setLabelProperty] = useState(layer.labelProperty ?? "");
  const [rules, setRules] = useState<StyleRule[]>(layer.colorRules ?? []);
  const [categoryProperty, setCategoryProperty] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [fillColor, setFillColor] = useState(layer.fillColor);
  const [fillOpacity, setFillOpacity] = useState(layer.fillOpacity);
  const [strokeColor, setStrokeColor] = useState(layer.strokeColor);
  const [popupEnabled, setPopupEnabled] = useState(layer.popupEnabled ?? true);
  // null = unrestricted (show every property the feature has — the
  // original behavior, and what an empty/unset popupProperties means on
  // the layer itself). Only becomes a concrete Set once the user unchecks
  // at least one property.
  const [popupProperties, setPopupProperties] = useState<Set<string> | null>(
    layer.popupProperties && layer.popupProperties.length > 0
      ? new Set(layer.popupProperties)
      : null,
  );
  const [strokeStyle, setStrokeStyle] = useState<"solid" | "dashed" | "dotted">(
    layer.strokeStyle ?? "solid",
  );

  // Filters the "Select Feature / Plot" dropdown below — without this a
  // layer with hundreds of plots was an unsearchable single <select>.
  const [featureSearch, setFeatureSearch] = useState("");

  const [individualProperty, setIndividualProperty] = useState("");
  const [individualSearch, setIndividualSearch] = useState("");
  const [individualSelected, setIndividualSelected] = useState<string[]>([]);
  const [individualColor, setIndividualColor] = useState("#0EA5E9");
  const [individualOpacity, setIndividualOpacity] = useState(layer.fillOpacity);
  const [individualError, setIndividualError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    mappingService
      .getLayerGeoJson(layer.id)
      .then(
        (geojson: {
          features?: {
            properties?: Record<string, unknown> | null;
            geometry?: { type?: string };
          }[];
        }) => {
          const features = geojson.features ?? [];
          setFeatureCache(features);
          const keys = Object.keys(features[0]?.properties ?? {});
          setProperties(keys);
          setCategoryProperty((current) => current || keys[0] || "");
          setIndividualProperty(
            (current) => current || layer.labelProperty || keys[0] || "",
          );
          setIsLineLayer(
            LINE_GEOMETRY_TYPES.has(features[0]?.geometry?.type ?? ""),
          );
          setPropertiesLoaded(true);
        },
      )
      .catch(() => setPropertiesLoaded(true));
  }, [layer.id]);

  const generateCategoryRules = () => {
    setCategoryError(null);
    if (!categoryProperty) return;
    const values = distinctValues(featureCache, categoryProperty);
    if (values.length === 0) {
      setCategoryError("No values found for that property.");
      return;
    }
    if (values.length > MAX_CATEGORY_VALUES) {
      setCategoryError(
        `${values.length} distinct values — pick a more categorical property (max ${MAX_CATEGORY_VALUES}).`,
      );
      return;
    }
    const generated: StyleRule[] = values.map((value, i) => ({
      id: newRuleId(),
      property: categoryProperty,
      value,
      action: "color",
      color: LAYER_COLOR_PALETTE[i % LAYER_COLOR_PALETTE.length],
    }));
    // Replace any existing rules for this property so re-generating doesn't duplicate them.
    setRules((current) => [
      ...current.filter((r) => r.property !== categoryProperty),
      ...generated,
    ]);
  };

  const updateRuleColor = useCallback(
    (id: string, color: string) =>
      setRules((current) =>
        current.map((r) => (r.id === id ? { ...r, color } : r)),
      ),
    [],
  );

  const updateRuleOpacity = useCallback(
    (id: string, opacity: number) =>
      setRules((current) =>
        current.map((r) => (r.id === id ? { ...r, opacity } : r)),
      ),
    [],
  );

  const removeRule = useCallback(
    (id: string) => setRules((current) => current.filter((r) => r.id !== id)),
    [],
  );

  // Unchecking the first field seeds the set from every currently-known
  // property (so it starts from "everything on" rather than forcing the
  // user to check every other box by hand) before removing this one.
  const togglePopupProperty = useCallback(
    (prop: string) =>
      setPopupProperties((current) => {
        const next = new Set(current ?? properties);
        if (next.has(prop)) next.delete(prop);
        else next.add(prop);
        return next;
      }),
    [properties],
  );

  // Recomputed only when the feature cache or chosen property changes, not
  // on every keystroke of the plot search box below.
  const individualValues = useMemo(
    () => distinctValues(featureCache, individualProperty),
    [featureCache, individualProperty],
  );
  const individualSearchTerm = individualSearch.trim().toLowerCase();
  // Memoized: without this, filtering/slicing potentially thousands of
  // distinct values reran on every render of the whole panel — e.g.
  // dragging the base fill-opacity slider elsewhere in the form — not
  // just when the search term or underlying values actually changed.
  const individualMatches = useMemo(
    () =>
      individualSearchTerm
        ? individualValues.filter((v) =>
            v.toLowerCase().includes(individualSearchTerm),
          )
        : individualValues,
    [individualValues, individualSearchTerm],
  );
  const individualMatchesShown = useMemo(
    () => individualMatches.slice(0, 50),
    [individualMatches],
  );

  // Filters the "Select Feature / Plot" checklist by label
  // (Plot/name/label/fid) against featureSearch — same search-then-pick
  // pattern as the plot-color search below.
  const featureSearchTerm = featureSearch.trim().toLowerCase();
  const filteredFeatureOptions = useMemo(() => {
    const withIndex = featureCache.map((feat, idx) => ({ feat, idx, label: featureLabel(feat, idx) }));
    if (!featureSearchTerm) return withIndex;
    return withIndex.filter(({ label }) => label.toLowerCase().includes(featureSearchTerm));
  }, [featureCache, featureSearchTerm]);
  // Capped render list — a 500+ feature layer shouldn't paint 500+ list
  // items on every keystroke; "Add all" below still operates on the full
  // (unsliced) filteredFeatureOptions.
  const filteredFeatureOptionsShown = useMemo(
    () => filteredFeatureOptions.slice(0, 50),
    [filteredFeatureOptions],
  );

  const addToSelection = (value: string) =>
    setIndividualSelected((current) =>
      current.includes(value) ? current : [...current, value],
    );

  const removeFromSelection = (value: string) =>
    setIndividualSelected((current) => current.filter((v) => v !== value));

  const selectAllMatches = () =>
    setIndividualSelected((current) =>
      Array.from(new Set([...current, ...individualMatches])),
    );

  // Enter either jumps straight to an exact match or, failing that, the top
  // search result — lets you add plot after plot without touching the mouse.
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const exact = individualValues.find(
      (v) => v.toLowerCase() === individualSearchTerm,
    );
    const target = exact ?? individualMatchesShown[0];
    if (target) {
      addToSelection(target);
      setIndividualSearch("");
    }
  };

  const applyIndividualColor = () => {
    setIndividualError(null);
    if (!individualProperty || individualSelected.length === 0) {
      setIndividualError("Pick a property and at least one plot.");
      return;
    }
    setRules((current) => {
      let next = current;
      for (const value of individualSelected) {
        const existing = next.find(
          (r) =>
            r.property === individualProperty &&
            r.value === value &&
            r.action === "color",
        );
        if (existing) {
          next = next.map((r) =>
            r === existing
              ? { ...r, color: individualColor, opacity: individualOpacity }
              : r,
          );
        } else {
          // Prepended, not appended: rules are matched in order and the
          // first match wins (see dataStyleFor in MapView.tsx), so an
          // individual override must come before any category rule that
          // might also match this feature (e.g. its Status) or it would
          // never be reached.
          next = [
            {
              id: newRuleId(),
              property: individualProperty,
              value,
              action: "color",
              color: individualColor,
              opacity: individualOpacity,
            },
            ...next,
          ];
        }
      }
      return next;
    });
    setIndividualSelected([]);
  };

  const [batchProperty, setBatchProperty] = useState<string>("");
  const [batchOldValue, setBatchOldValue] = useState<string>("");
  const [batchNewValue, setBatchNewValue] = useState<string>("");
  const [batchSaving, setBatchSaving] = useState<boolean>(false);
  const [batchMsg, setBatchMsg] = useState<string | null>(null);

  // Individual Feature Attribute Editing state — a plain array of feature
  // indices, not a single value, so more than one plot can be picked at
  // once. Exactly one selected shows the full per-field editor below;
  // two or more switches to the "set one attribute on all of them" panel
  // instead (editing every field of several different features in one form
  // doesn't make sense).
  const [editSelectedIndices, setEditSelectedIndices] = useState<number[]>([]);
  const [singleFeatureProps, setSingleFeatureProps] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [singleFeatureSaving, setSingleFeatureSaving] =
    useState<boolean>(false);
  const [singleFeatureMsg, setSingleFeatureMsg] = useState<string | null>(null);

  // Keeps singleFeatureProps in sync with the selection declaratively —
  // covers both selection changes and featureCache refreshes (e.g. after
  // add/delete attribute, or this panel's own save) without every mutation
  // site needing to remember to re-sync it by hand. Deliberately does NOT
  // clear singleFeatureMsg here — it also re-runs right after a successful
  // save (which refreshes featureCache), and clearing it there would wipe
  // out the "✓ Updated" message before anyone saw it. Selection-change
  // handlers below clear it themselves instead.
  useEffect(() => {
    if (editSelectedIndices.length === 1 && featureCache[editSelectedIndices[0]]) {
      setSingleFeatureProps({ ...(featureCache[editSelectedIndices[0]].properties ?? {}) });
    } else {
      setSingleFeatureProps(null);
    }
  }, [editSelectedIndices, featureCache]);

  const [bulkEditProperty, setBulkEditProperty] = useState("");
  const [bulkEditValue, setBulkEditValue] = useState("");
  const [bulkEditSaving, setBulkEditSaving] = useState(false);
  const [bulkEditMsg, setBulkEditMsg] = useState<string | null>(null);

  // Adds a brand-new attribute key to every feature in the layer (not just
  // whichever one happens to be selected above) so it's immediately
  // available to edit per-plot.
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrDefaultValue, setNewAttrDefaultValue] = useState("");
  const [addAttrSaving, setAddAttrSaving] = useState(false);
  const [addAttrMsg, setAddAttrMsg] = useState<string | null>(null);

  const handleAddAttributeToAllPlots = async () => {
    const key = newAttrKey.trim();
    if (!key) return;
    setAddAttrSaving(true);
    setAddAttrMsg(null);
    try {
      const result = await mappingService.updateLayerFeatures(layer.id, {
        addProperty: { key, defaultValue: newAttrDefaultValue.trim() || undefined },
      });
      const geojson = await mappingService.getLayerGeoJson(layer.id);
      const features = geojson.features ?? [];
      setFeatureCache(features);
      setProperties(Object.keys(features[0]?.properties ?? {}));
      setNewAttrKey("");
      setNewAttrDefaultValue("");
      setAddAttrMsg(`✓ Added "${key}" to ${result.addedCount ?? 0} plot(s)`);
    } catch {
      setAddAttrMsg("❌ Error adding attribute");
    } finally {
      setAddAttrSaving(false);
    }
  };

  // Deletes an attribute column from every feature in the layer — the
  // inverse of "Add Custom Attribute" above. Distinct from the per-plot "✕"
  // next to each field below, which only removes it from the one currently
  // selected feature.
  const [deleteAttrKey, setDeleteAttrKey] = useState("");
  const [deleteAttrSaving, setDeleteAttrSaving] = useState(false);
  const [deleteAttrMsg, setDeleteAttrMsg] = useState<string | null>(null);

  const handleDeleteAttributeFromAllPlots = async () => {
    const key = deleteAttrKey;
    if (!key) return;
    if (
      !window.confirm(
        `Delete attribute "${key}" from all ${featureCache.length} plot(s) in this layer? This cannot be undone.`,
      )
    )
      return;
    setDeleteAttrSaving(true);
    setDeleteAttrMsg(null);
    try {
      const result = await mappingService.updateLayerFeatures(layer.id, {
        removeProperty: { key },
      });
      const geojson = await mappingService.getLayerGeoJson(layer.id);
      const features = geojson.features ?? [];
      setFeatureCache(features);
      setProperties(Object.keys(features[0]?.properties ?? {}));
      setDeleteAttrKey("");
      setDeleteAttrMsg(`✓ Removed "${key}" from ${result.removedCount ?? 0} plot(s)`);
    } catch {
      setDeleteAttrMsg("❌ Error deleting attribute");
    } finally {
      setDeleteAttrSaving(false);
    }
  };

  // Multi-select plot picker: click a match to toggle it in/out of the
  // selection, "Add all" seeds every current match, "Clear" empties it.
  // Each clears any leftover save/error message from the prior selection.
  const toggleEditSelection = (idx: number) => {
    setSingleFeatureMsg(null);
    setEditSelectedIndices((current) =>
      current.includes(idx) ? current.filter((i) => i !== idx) : [...current, idx],
    );
  };

  const selectAllEditMatches = () => {
    setSingleFeatureMsg(null);
    setEditSelectedIndices((current) =>
      Array.from(new Set([...current, ...filteredFeatureOptions.map((o) => o.idx)])),
    );
  };

  const clearEditSelection = () => {
    setSingleFeatureMsg(null);
    setEditSelectedIndices([]);
  };

  // Enter jumps straight to the top search result, same shortcut as the
  // "Color Individual Plots" search box below.
  const handleFeatureSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const top = filteredFeatureOptions[0];
    if (top) {
      toggleEditSelection(top.idx);
      setFeatureSearch("");
    }
  };

  const handleSinglePropChange = (key: string, value: string) => {
    if (!singleFeatureProps) return;
    setSingleFeatureProps({
      ...singleFeatureProps,
      [key]: value,
    });
  };

  const handleRemoveSingleProp = (key: string) => {
    if (!singleFeatureProps) return;
    const next = { ...singleFeatureProps };
    delete next[key];
    setSingleFeatureProps(next);
  };

  const handleSaveSingleFeature = async () => {
    const idx = editSelectedIndices[0];
    if (idx === undefined || !singleFeatureProps) return;
    setSingleFeatureSaving(true);
    setSingleFeatureMsg(null);
    try {
      await mappingService.updateLayerFeatures(layer.id, {
        featureIndex: idx,
        properties: singleFeatureProps,
      });
      const geojson = await mappingService.getLayerGeoJson(layer.id);
      setFeatureCache(geojson.features ?? []);
      setSingleFeatureMsg(`✓ Updated Feature #${idx + 1} successfully!`);
    } catch {
      setSingleFeatureMsg("❌ Error saving feature attributes");
    } finally {
      setSingleFeatureSaving(false);
    }
  };

  const handleBulkSetValue = async () => {
    if (!bulkEditProperty || editSelectedIndices.length === 0) return;
    setBulkEditSaving(true);
    setBulkEditMsg(null);
    try {
      const result = await mappingService.updateLayerFeatures(layer.id, {
        bulkSetValue: { property: bulkEditProperty, value: bulkEditValue, featureIndices: editSelectedIndices },
      });
      const geojson = await mappingService.getLayerGeoJson(layer.id);
      setFeatureCache(geojson.features ?? []);
      setBulkEditMsg(`✓ Set "${bulkEditProperty}" on ${result.updatedCount ?? 0} plot(s)`);
    } catch {
      setBulkEditMsg("❌ Error updating plots");
    } finally {
      setBulkEditSaving(false);
    }
  };

  const handleBatchValueUpdate = async () => {
    if (!batchProperty || !batchOldValue.trim() || !batchNewValue.trim())
      return;
    setBatchSaving(true);
    setBatchMsg(null);
    try {
      const data = await mappingService.updateLayerFeatures(layer.id, {
        batchUpdate: {
          property: batchProperty,
          oldValue: batchOldValue.trim(),
          newValue: batchNewValue.trim(),
        },
      });
      setBatchMsg(
        `✓ Updated ${data.updatedCount} feature(s) from "${batchOldValue}" to "${batchNewValue}"`,
      );
      setBatchOldValue("");
      setBatchNewValue("");
    } catch (err) {
      setBatchMsg("❌ Error updating feature values");
    } finally {
      setBatchSaving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        labelProperty,
        colorRules: rules,
        fillColor,
        fillOpacity,
        strokeColor,
        popupEnabled,
        popupProperties:
          popupProperties === null ? [] : Array.from(popupProperties),
        strokeStyle,
      });
      onClose();
    } catch {
      setSaveError("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-5">
      <div className="max-h-[94vh] w-full max-w-full lg:max-w-6xl flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 shrink-0 bg-zinc-50/80 backdrop-blur">
          <div>
            <h2 className="text-base font-bold text-zinc-900 truncate mr-2 flex items-center gap-2">
              <span>⚙️ Layer Settings</span>
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {layer.label}
              </span>
            </h2>
            <p className="text-xs text-zinc-500 hidden sm:block">
              Configure map labels, attribute data values, category rules, and
              plot colors
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* Scrollable Body — Pixel-Perfect 3-Column Grid */}
        <div className="overflow-y-auto p-4 sm:p-5 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {/* Column 1: Base Color, Border, Labels & Popup */}
            <div className="space-y-5">
              {/* Base color + opacity */}
              <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  🎨 Base Color &amp; Border Style
                </h3>
                <p className="mb-3 text-[11px] text-zinc-500">
                  Default fallback for features without matching rules.
                </p>

                <div className="mb-3 flex items-center gap-3">
                  <label className="w-14 shrink-0 text-xs font-medium text-zinc-600">
                    Fill
                  </label>
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="h-9 w-12 shrink-0 rounded-lg border border-zinc-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={fillOpacity}
                    onChange={(e) => setFillOpacity(Number(e.target.value))}
                    className="flex-1 accent-blue-600 h-2 rounded-lg bg-zinc-200 cursor-pointer"
                  />
                  <span className="w-10 shrink-0 text-right text-xs font-bold text-zinc-700">
                    {Math.round(fillOpacity * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-14 shrink-0 text-xs font-medium text-zinc-600">
                    Border
                  </label>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="h-9 w-12 shrink-0 rounded-lg border border-zinc-300 cursor-pointer p-0.5 bg-white"
                  />
                </div>

                {isLineLayer && (
                  <div className="mt-3 flex items-center gap-3">
                    <label className="w-14 shrink-0 text-xs font-medium text-zinc-600">
                      Line style
                    </label>
                    <div className="flex flex-1 overflow-hidden rounded-lg border border-zinc-300">
                      {(
                        [
                          { id: "solid", label: "Normal", dash: "none" },
                          { id: "dashed", label: "Dashed", dash: "6,4" },
                          { id: "dotted", label: "Dotted", dash: "1.5,4" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setStrokeStyle(opt.id)}
                          className={`flex flex-1 flex-col items-center gap-1 px-2 py-1.5 text-[11px] font-medium transition-colors ${
                            strokeStyle === opt.id
                              ? "bg-blue-600 text-white"
                              : "text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          <svg
                            width="32"
                            height="8"
                            viewBox="0 0 32 8"
                            aria-hidden="true"
                          >
                            <line
                              x1="1"
                              y1="4"
                              x2="31"
                              y2="4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeDasharray={opt.dash}
                              strokeLinecap="round"
                            />
                          </svg>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Label on map */}
              <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  🏷️ Label On Map
                </h3>
                <p className="mb-3 text-[11px] text-zinc-500">
                  Display property values as text labels directly on map plots.
                </p>
                <select
                  value={labelProperty}
                  onChange={(e) => setLabelProperty(e.target.value)}
                  className="w-full h-9 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-900"
                  style={{ colorScheme: "light" }}
                >
                  <option value="">No label</option>
                  {properties.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </section>

              {/* Popup on click */}
              <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm">
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popupEnabled}
                    onChange={(e) => setPopupEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  Enable Feature Popups
                </label>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Controls whether clicking a feature opens its attribute popup.
                </p>

                {popupEnabled && (
                  <div className="mt-3 pt-3 border-t border-zinc-200">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-[11px] font-bold uppercase text-zinc-500">
                        Popup Fields
                      </h4>
                      {popupProperties !== null && (
                        <button
                          onClick={() => setPopupProperties(null)}
                          className="text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          Show all
                        </button>
                      )}
                    </div>
                    {propertiesLoaded && properties.length === 0 ? (
                      <p className="text-xs text-zinc-400">
                        No properties in layer.
                      </p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-zinc-200 p-2">
                        {properties.map((p) => {
                          const isChecked =
                            popupProperties === null || popupProperties.has(p);
                          return (
                            <label
                              key={p}
                              className="flex items-center gap-2.5 text-xs text-zinc-700 cursor-pointer hover:bg-zinc-100 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePopupProperty(p)}
                                className="accent-blue-600 h-3.5 w-3.5"
                              />
                              <span className="truncate font-medium">{p}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Column 2: Edit Feature Data & Attributes (Middle Column) */}
            <div className="space-y-5">
              {/* Single Feature Attribute Editor */}
              <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  ✏️ Edit Specific Feature / Plot
                </h3>
                <p className="mb-3 text-[11px] text-zinc-500">
                  Select a specific feature (by ID or Plot name) and edit all
                  its attribute values directly.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 block mb-1">
                      Select Feature / Plot(s)
                    </label>

                    {editSelectedIndices.length > 0 && (
                      <ul className="mb-2 flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                        {editSelectedIndices.map((idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                          >
                            {featureCache[idx] ? featureLabel(featureCache[idx], idx) : `#${idx + 1}`}
                            <button
                              onClick={() => toggleEditSelection(idx)}
                              aria-label={`Remove from selection`}
                              className="text-blue-500 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex gap-2">
                      <input
                        value={featureSearch}
                        onChange={(e) => setFeatureSearch(e.target.value)}
                        onKeyDown={handleFeatureSearchKeyDown}
                        placeholder="Search plots, e.g. A-12"
                        className="min-w-0 flex-1 h-9 rounded-lg border border-zinc-300 px-3 text-xs text-zinc-900"
                      />
                      <button
                        onClick={selectAllEditMatches}
                        disabled={filteredFeatureOptions.length === 0}
                        className="shrink-0 h-9 rounded-lg border border-zinc-300 px-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                      >
                        Add all ({filteredFeatureOptions.length})
                      </button>
                    </div>

                    {filteredFeatureOptionsShown.length > 0 && (
                      <ul className="mt-2 max-h-36 space-y-0.5 overflow-y-auto rounded-lg border border-zinc-200 p-1.5">
                        {filteredFeatureOptionsShown.map(({ idx, label }) => {
                          const isSelected = editSelectedIndices.includes(idx);
                          return (
                            <li key={idx}>
                              <button
                                onClick={() => toggleEditSelection(idx)}
                                className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs ${
                                  isSelected
                                    ? "bg-blue-50 text-blue-700 font-bold"
                                    : "text-zinc-600 hover:bg-zinc-100"
                                }`}
                              >
                                {label}
                                {isSelected && <span>✓</span>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {filteredFeatureOptions.length > filteredFeatureOptionsShown.length && (
                      <p className="mt-1 text-xs text-zinc-400">
                        +{filteredFeatureOptions.length - filteredFeatureOptionsShown.length} more — refine your
                        search to see them.
                      </p>
                    )}
                    {editSelectedIndices.length > 0 && (
                      <button
                        onClick={clearEditSelection}
                        className="mt-1 text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>

                  <div className="pt-1">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 block mb-1">
                      Add Custom Attribute (all plots)
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={newAttrKey}
                        onChange={(e) => setNewAttrKey(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddAttributeToAllPlots();
                        }}
                        placeholder="e.g. Facing"
                        className="min-w-0 flex-1 h-9 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-900"
                      />
                      <input
                        value={newAttrDefaultValue}
                        onChange={(e) => setNewAttrDefaultValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddAttributeToAllPlots();
                        }}
                        placeholder="Default value (optional)"
                        className="min-w-0 flex-1 h-9 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-900"
                      />
                      <button
                        onClick={handleAddAttributeToAllPlots}
                        disabled={addAttrSaving || !newAttrKey.trim()}
                        className="shrink-0 h-9 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                      >
                        {addAttrSaving ? "Adding..." : "+ Add to All Plots"}
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Adds this field to every plot in the layer, set to the
                      default value above (or empty if left blank) — edit it
                      per plot below.
                    </p>
                    {addAttrMsg && (
                      <p
                        className={`mt-1.5 text-xs font-medium ${addAttrMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {addAttrMsg}
                      </p>
                    )}
                  </div>

                  <div className="pt-1">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 block mb-1">
                      Delete Attribute (all plots)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={deleteAttrKey}
                        onChange={(e) => setDeleteAttrKey(e.target.value)}
                        disabled={properties.length === 0}
                        className="min-w-0 flex-1 h-9 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-900"
                        style={{ colorScheme: "light" }}
                      >
                        <option value="">Select attribute to delete...</option>
                        {properties.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleDeleteAttributeFromAllPlots}
                        disabled={deleteAttrSaving || !deleteAttrKey}
                        className="shrink-0 h-9 rounded-lg bg-red-600 px-3.5 text-xs font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleteAttrSaving ? "Deleting..." : "🗑 Delete"}
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Permanently removes this field from every plot in the
                      layer.
                    </p>
                    {deleteAttrMsg && (
                      <p
                        className={`mt-1.5 text-xs font-medium ${deleteAttrMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {deleteAttrMsg}
                      </p>
                    )}
                  </div>

                  {editSelectedIndices.length === 1 && singleFeatureProps && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 space-y-3">
                      <div className="max-h-64 overflow-y-auto space-y-2 p-1 border border-zinc-200 rounded-lg">
                        {Object.entries(singleFeatureProps).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2 px-1">
                            <span
                              className="w-28 text-xs font-bold text-zinc-600 truncate"
                              title={k}
                            >
                              {k}
                            </span>
                            <input
                              value={
                                v === null || v === undefined ? "" : String(v)
                              }
                              onChange={(e) =>
                                handleSinglePropChange(k, e.target.value)
                              }
                              className="flex-1 h-8 rounded-md border border-zinc-300 px-2 text-xs font-medium text-zinc-900"
                            />
                            <button
                              onClick={() => handleRemoveSingleProp(k)}
                              className="text-xs text-red-500 hover:text-red-700 p-1 font-bold"
                              title="Delete attribute"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleSaveSingleFeature}
                        disabled={singleFeatureSaving}
                        className="w-full h-9 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {singleFeatureSaving
                          ? "Saving..."
                          : "Save Feature Attributes"}
                      </button>
                      {singleFeatureMsg && (
                        <p
                          className={`text-xs font-medium ${singleFeatureMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {singleFeatureMsg}
                        </p>
                      )}
                    </div>
                  )}

                  {editSelectedIndices.length >= 2 && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 block">
                        Set Attribute Value ({editSelectedIndices.length} plots)
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={bulkEditProperty}
                          onChange={(e) => setBulkEditProperty(e.target.value)}
                          disabled={properties.length === 0}
                          className="min-w-0 flex-1 h-9 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-900"
                          style={{ colorScheme: "light" }}
                        >
                          <option value="">Select attribute...</option>
                          {properties.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <input
                          value={bulkEditValue}
                          onChange={(e) => setBulkEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleBulkSetValue();
                          }}
                          placeholder="New value"
                          className="min-w-0 flex-1 h-9 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-900"
                        />
                      </div>
                      <button
                        onClick={handleBulkSetValue}
                        disabled={bulkEditSaving || !bulkEditProperty}
                        className="w-full h-9 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {bulkEditSaving
                          ? "Applying..."
                          : `Apply to ${editSelectedIndices.length} Plot(s)`}
                      </button>
                      <p className="text-[11px] text-zinc-500">
                        Sets this one attribute to this value on every
                        selected plot — their other fields are untouched.
                      </p>
                      {bulkEditMsg && (
                        <p
                          className={`text-xs font-medium ${bulkEditMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {bulkEditMsg}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Batch Edit Feature Values */}
              <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  ⚡ Batch Edit Feature Values
                </h3>
                <p className="mb-3 text-[11px] text-zinc-500">
                  Rename or bulk update attribute values across all features in
                  this layer.
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 block mb-1">
                      Target Property Column
                    </label>
                    <select
                      value={batchProperty}
                      onChange={(e) => setBatchProperty(e.target.value)}
                      className="w-full h-9 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-900"
                  style={{ colorScheme: "light" }}
                    >
                      <option value="">Select property column...</option>
                      {properties.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 block mb-1">
                        Old Value
                      </label>
                      <input
                        value={batchOldValue}
                        onChange={(e) => setBatchOldValue(e.target.value)}
                        placeholder="e.g. Available"
                        className="w-full h-8 rounded-md border border-zinc-300 px-2.5 text-xs font-medium text-zinc-900"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 block mb-1">
                        New Value
                      </label>
                      <input
                        value={batchNewValue}
                        onChange={(e) => setBatchNewValue(e.target.value)}
                        placeholder="e.g. Reserved"
                        className="w-full h-8 rounded-md border border-zinc-300 px-2.5 text-xs font-medium text-zinc-900"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleBatchValueUpdate}
                    disabled={
                      batchSaving ||
                      !batchProperty ||
                      !batchOldValue.trim() ||
                      !batchNewValue.trim()
                    }
                    className="mt-1 w-full h-9 rounded-lg bg-purple-600 px-4 text-xs font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {batchSaving ? "Updating..." : "Batch Update Values"}
                  </button>

                  {batchMsg && (
                    <p
                      className={`text-xs mt-1.5 font-medium ${batchMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {batchMsg}
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Column 3: Color Styling & Rules (Right Column) */}
            <div className="space-y-5">
              {/* Color by category */}
              <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  🎯 Color By Category
                </h3>
                <p className="mb-3 text-[11px] text-zinc-500">
                  Auto-assign distinct colors to unique property values (e.g.
                  Status = Available/Sold).
                </p>
                <div className="flex gap-2 mb-3">
                  <select
                    value={categoryProperty}
                    onChange={(e) => setCategoryProperty(e.target.value)}
                    disabled={!propertiesLoaded || properties.length === 0}
                    className="min-w-0 flex-1 h-9 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-900"
                    style={{ colorScheme: "light" }}
                  >
                    {properties.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={generateCategoryRules}
                    disabled={!categoryProperty}
                    className="shrink-0 h-9 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                  >
                    Generate
                  </button>
                </div>
                {categoryError && (
                  <p className="mt-1.5 text-xs text-red-500 mb-2">
                    {categoryError}
                  </p>
                )}

                <RulesList
                  rules={rules}
                  fillOpacity={fillOpacity}
                  onColorChange={updateRuleColor}
                  onOpacityChange={updateRuleOpacity}
                  onRemove={removeRule}
                />
              </section>

              {/* Color individual plots */}
              <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  🔍 Color Individual Plots
                </h3>
                <p className="mb-3 text-[11px] text-zinc-500">
                  Search &amp; select specific plots to apply custom color
                  overrides.
                </p>

                <select
                  value={individualProperty}
                  onChange={(e) => {
                    setIndividualProperty(e.target.value);
                    setIndividualSearch("");
                    setIndividualSelected([]);
                  }}
                  disabled={!propertiesLoaded || properties.length === 0}
                  className="mb-2.5 w-full h-9 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-900"
                  style={{ colorScheme: "light" }}
                >
                  {properties.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {individualSelected.length > 0 && (
                  <ul className="mb-2 flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                    {individualSelected.map((value) => (
                      <li
                        key={value}
                        className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                      >
                        {value}
                        <button
                          onClick={() => removeFromSelection(value)}
                          aria-label={`Remove ${value}`}
                          className="text-blue-500 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2">
                  <input
                    value={individualSearch}
                    onChange={(e) => setIndividualSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search plots, e.g. A-12"
                    className="min-w-0 flex-1 h-9 rounded-lg border border-zinc-300 px-3 text-xs text-zinc-900"
                  />
                  <button
                    onClick={selectAllMatches}
                    disabled={individualMatches.length === 0}
                    className="shrink-0 h-9 rounded-lg border border-zinc-300 px-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                  >
                    Add all ({individualMatches.length})
                  </button>
                </div>

                {individualMatchesShown.length > 0 && (
                  <ul className="mt-2 max-h-36 space-y-0.5 overflow-y-auto rounded-lg border border-zinc-200 p-1.5">
                    {individualMatchesShown.map((value) => {
                      const isSelected = individualSelected.includes(value);
                      return (
                        <li key={value}>
                          <button
                            onClick={() =>
                              isSelected
                                ? removeFromSelection(value)
                                : addToSelection(value)
                            }
                            className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs ${
                              isSelected
                                ? "bg-blue-50 text-blue-700 font-bold"
                                : "text-zinc-600 hover:bg-zinc-100"
                            }`}
                          >
                            {value}
                            {isSelected && <span>✓</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {individualMatches.length > individualMatchesShown.length && (
                  <p className="mt-1 text-xs text-zinc-400">
                    +{individualMatches.length - individualMatchesShown.length}{" "}
                    more — refine your search to see them.
                  </p>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="color"
                    value={individualColor}
                    onChange={(e) => setIndividualColor(e.target.value)}
                    className="h-9 w-12 shrink-0 rounded-lg border border-zinc-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={individualOpacity}
                    onChange={(e) =>
                      setIndividualOpacity(Number(e.target.value))
                    }
                    className="flex-1 accent-blue-600 h-2 rounded-lg bg-zinc-200 cursor-pointer"
                  />
                  <span className="w-10 shrink-0 text-right text-xs font-bold text-zinc-700">
                    {Math.round(individualOpacity * 100)}%
                  </span>
                </div>
                <button
                  onClick={applyIndividualColor}
                  disabled={
                    !individualProperty || individualSelected.length === 0
                  }
                  className="mt-3 w-full h-9 rounded-lg bg-zinc-800 px-3 text-xs font-bold text-white shadow hover:bg-zinc-700 disabled:opacity-50"
                >
                  Set color
                  {individualSelected.length > 0
                    ? `(${individualSelected.length} plot${individualSelected.length === 1 ? "" : "s"})`
                    : ""}
                </button>
                {individualError && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {individualError}
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* Sticky Footer for Phone & Desktop */}
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 shrink-0">
          {saveError && (
            <p className="mb-2 text-xs text-red-500">{saveError}</p>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Layer Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
