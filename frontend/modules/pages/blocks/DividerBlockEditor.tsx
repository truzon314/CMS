import { SelectField } from "@/components/forms/SelectField";
import { cn } from "@/lib/utils";
import type { DividerConfig } from "@/types/blockConfigs";

interface Props {
  config: DividerConfig;
  onChange: (config: DividerConfig) => void;
}

const STYLE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

export function DividerBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <SelectField
        id="divider_style"
        label="Style"
        value={config.style}
        onChange={(value) => onChange({ ...config, style: value as DividerConfig["style"] })}
        options={STYLE_OPTIONS}
      />
      <hr
        className={cn(
          "border-neutral-300",
          config.style === "dashed" && "border-dashed",
          config.style === "dotted" && "border-dotted"
        )}
      />
    </div>
  );
}
