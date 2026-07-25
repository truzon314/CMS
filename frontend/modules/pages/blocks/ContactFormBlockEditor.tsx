import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContactFormConfig } from "@/types/blockConfigs";

interface Props {
  config: ContactFormConfig;
  onChange: (config: ContactFormConfig) => void;
}

const FORM_KEY_OPTIONS = [
  { value: "hero_quick_enquiry", label: "Quick Enquiry" },
  { value: "contact_callback", label: "Request a Callback" },
];

export function ContactFormBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <TextField
        id="contact_form_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact_form_description">Description (optional)</Label>
        <Textarea
          id="contact_form_description"
          rows={2}
          value={config.description}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
        />
      </div>
      <SelectField
        id="contact_form_key"
        label="Which form"
        value={config.form_key}
        onChange={(value) => onChange({ ...config, form_key: value as ContactFormConfig["form_key"] })}
        options={FORM_KEY_OPTIONS}
      />
      <p className="text-xs text-neutral-500">
        The actual submission handling lands in the Forms module (ROADMAP.md Phase 5) — this
        block just marks which form renders here.
      </p>
    </div>
  );
}
