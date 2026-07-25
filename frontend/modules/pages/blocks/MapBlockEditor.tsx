import { TextField } from "@/components/forms/TextField";
import type { MapConfig } from "@/types/blockConfigs";

interface Props {
  config: MapConfig;
  onChange: (config: MapConfig) => void;
}

export function MapBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <TextField
        id="map_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />
      <TextField
        id="map_address"
        label="Address"
        value={config.address}
        onChange={(e) => onChange({ ...config, address: e.target.value })}
      />
      <TextField
        id="map_embed_url"
        label="Google Maps embed URL"
        placeholder="https://www.google.com/maps/embed?..."
        value={config.embed_url}
        onChange={(e) => onChange({ ...config, embed_url: e.target.value })}
      />
      {config.embed_url ? (
        <iframe src={config.embed_url} className="h-48 w-full rounded-md border" loading="lazy" title="Map preview" />
      ) : null}
    </div>
  );
}
