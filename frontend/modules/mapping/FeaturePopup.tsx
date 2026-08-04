import { buildPropertyAllowlist, isPropertyAllowed, type LayerConfig } from "@/lib/layers";

type LatLng = { lat: number; lng: number };

const MAX_ROWS = 8;
const TITLE_KEYS = ["name", "Name", "NAME", "title", "Title", "label", "Label"];

function directionsUrl(position: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`;
}

// Opens Google Maps in a new tab with turn-by-turn directions to this
// feature's clicked point (from the visitor's current location).
function DirectionsButton({ position }: { position: LatLng }) {
  return (
    <a
      href={directionsUrl(position)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3.5 flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
      </svg>
      Get Directions
    </a>
  );
}

function isMeaningful(value: unknown): value is string | number | boolean {
  return value !== null && value !== undefined && value !== "" && value !== "Null";
}

function formatValue(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

// Popup shown when a feature on any layer is clicked. Picks a title from a
// name/title-ish property if the feature has one, falls back to the layer
// name, and lists the rest of the attributes in a compact table (capped so
// a feature with dozens of fields doesn't produce a giant popup).
export function FeaturePopup({
  layer,
  props,
  position,
  onEdit,
}: {
  layer: LayerConfig;
  props: Record<string, unknown>;
  position: LatLng;
  onEdit?: () => void;
}) {
  const allowed = buildPropertyAllowlist(layer.popupProperties);
  const entries = Object.entries(props).filter(
    ([key, value]) => key !== "fid" && isMeaningful(value) && isPropertyAllowed(key, allowed)
  ) as [string, string | number | boolean][];

  const titleKey = TITLE_KEYS.find((k) => isMeaningful(props[k]) && isPropertyAllowed(k, allowed));
  const title = titleKey ? String(props[titleKey]) : layer.label;
  const rows = entries.filter(([key]) => key !== titleKey);
  const shown = rows.slice(0, MAX_ROWS);
  const hiddenCount = rows.length - shown.length;

  return (
    <div className="w-[320px] p-1 font-sans">
      <div className="mb-2.5 flex items-center justify-between">
        <div
          className="flex w-fit items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: layer.fillColor }}
        >
          {layer.label}
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            ✏️ Edit Values
          </button>
        )}
      </div>
      <h3 className="mb-3 text-xl font-bold leading-tight text-zinc-900">{title}</h3>

      {shown.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-zinc-100">
          <dl className="divide-y divide-zinc-100 text-sm">
            {shown.map(([key, value], i) => (
              <div
                key={key}
                className={`flex justify-between gap-4 px-3 py-2 ${i % 2 === 1 ? "bg-zinc-50" : ""}`}
              >
                <dt className="font-medium text-zinc-500">{key}</dt>
                <dd className="truncate text-right font-semibold text-zinc-800">{formatValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">No attributes on this feature.</p>
      )}
      {hiddenCount > 0 && (
        <p className="mt-1.5 text-xs text-zinc-400">
          +{hiddenCount} more attribute{hiddenCount === 1 ? "" : "s"}
        </p>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <DirectionsButton position={position} />
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="mt-3.5 flex items-center justify-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            ✏️ Edit
          </button>
        )}
      </div>
    </div>
  );
}
