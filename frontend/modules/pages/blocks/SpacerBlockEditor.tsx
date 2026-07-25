import { SelectField } from "@/components/forms/SelectField";
import type { SpacerConfig } from "@/types/blockConfigs";

interface Props {
  config: SpacerConfig;
  onChange: (config: SpacerConfig) => void;
}

const SIZE_OPTIONS = [
  { value: "24", label: "Small" },
  { value: "48", label: "Medium" },
  { value: "96", label: "Large" },
];

export function SpacerBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <SelectField
        id="spacer_size"
        label="Height"
        value={String(config.height_px)}
        onChange={(value) => onChange({ ...config, height_px: Number(value) })}
        options={SIZE_OPTIONS}
      />
      <div className="rounded-md border border-dashed bg-neutral-50" style={{ height: config.height_px }} />
    </div>
  );
}
