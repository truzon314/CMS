import { TextField } from "@/components/forms/TextField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CtaConfig } from "@/types/blockConfigs";

interface Props {
  config: CtaConfig;
  onChange: (config: CtaConfig) => void;
}

export function CtaBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <TextField
        id="cta_heading"
        label="Heading"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cta_description">Description</Label>
        <Textarea
          id="cta_description"
          rows={3}
          value={config.description}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
        />
      </div>
      <TextField
        id="cta_button_label"
        label="Button label"
        value={config.button_label}
        onChange={(e) => onChange({ ...config, button_label: e.target.value })}
      />
      <TextField
        id="cta_button_href"
        label="Button link"
        value={config.button_href}
        onChange={(e) => onChange({ ...config, button_href: e.target.value })}
      />
    </div>
  );
}
