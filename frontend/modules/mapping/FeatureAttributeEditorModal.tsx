"use client";

import { useState } from "react";
import type { LayerConfig } from "@/lib/layers";
import { mappingService } from "@/services/mapping";

type Props = {
  layer: LayerConfig;
  featureIndex?: number;
  fid?: string;
  initialProperties: Record<string, unknown>;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedProperties: Record<string, unknown>) => void;
};

type KeyValuePair = {
  id: string;
  key: string;
  value: string;
};

function newPairId(): string {
  return `kv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function FeatureAttributeEditorModal({
  layer,
  featureIndex,
  fid,
  initialProperties,
  isOpen,
  onClose,
  onSaved,
}: Props) {
  const [pairs, setPairs] = useState<KeyValuePair[]>(() =>
    Object.entries(initialProperties).map(([k, v]) => ({
      id: newPairId(),
      key: k,
      value: v === null || v === undefined ? "" : String(v),
    })),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddPair = () => {
    setPairs((current) => [
      ...current,
      { id: newPairId(), key: "", value: "" },
    ]);
  };

  const handleRemovePair = (id: string) => {
    setPairs((current) => current.filter((p) => p.id !== id));
  };

  const handleKeyChange = (id: string, key: string) => {
    setPairs((current) =>
      current.map((p) => (p.id === id ? { ...p, key } : p)),
    );
  };

  const handleValueChange = (id: string, value: string) => {
    setPairs((current) =>
      current.map((p) => (p.id === id ? { ...p, value } : p)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    // Build updated properties map
    const updated: Record<string, unknown> = {};
    for (const p of pairs) {
      const trimmedKey = p.key.trim();
      if (!trimmedKey) continue;

      const trimmedVal = p.value.trim();
      // Parse numeric or boolean values automatically if applicable
      if (trimmedVal === "true") updated[trimmedKey] = true;
      else if (trimmedVal === "false") updated[trimmedKey] = false;
      else if (!isNaN(Number(trimmedVal)) && trimmedVal !== "")
        updated[trimmedKey] = Number(trimmedVal);
      else updated[trimmedKey] = p.value;
    }

    try {
      await mappingService.updateLayerFeatures(layer.id, {
        featureIndex,
        properties: updated,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save feature properties",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              ✏️ Edit Feature Attributes — {layer.label}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Modify attribute key-value pairs for this plot/feature
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {pairs.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">
              No attributes yet. Click &quot;+ Add Attribute&quot; below.
            </p>
          ) : (
            pairs.map((pair) => (
              <div key={pair.id} className="flex items-center gap-2">
                <input
                  value={pair.key}
                  onChange={(e) => handleKeyChange(pair.id, e.target.value)}
                  placeholder="Property name (e.g. Plot)"
                  className="w-1/3 rounded border border-zinc-300 px-2.5 py-1 text-xs outline-none font-semibold"
                />
                <span className="text-xs text-zinc-400">=</span>
                <input
                  value={pair.value}
                  onChange={(e) => handleValueChange(pair.id, e.target.value)}
                  placeholder="Value (e.g. A-105)"
                  className="flex-1 rounded border border-zinc-300 px-2.5 py-1 text-xs outline-none"
                />
                <button
                  onClick={() => handleRemovePair(pair.id)}
                  title="Remove attribute"
                  className="rounded p-1 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))
          )}

          <button
            onClick={handleAddPair}
            className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
          >
            + Add Attribute Property
          </button>

          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Attribute Values"}
          </button>
        </div>
      </div>
    </div>
  );
}
