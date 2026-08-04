import { TextField } from "@/components/forms/TextField";
import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TextConfig } from "@/types/blockConfigs";

interface Props {
  config: TextConfig;
  onChange: (config: TextConfig) => void;
}

export function TextBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <TextField
        id="text_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />
      <ImagePickerField
        label="Section Image (optional)"
        recommendedDimensions="800 × 600 px (4:3)"
        imageUrl={config.image_url ?? ""}
        onChange={({ url, mediaId }) => onChange({ ...config, image_url: url, image_media_id: mediaId })}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="text_body">Body</Label>
        <Textarea
          id="text_body"
          rows={6}
          value={config.body}
          onChange={(e) => onChange({ ...config, body: e.target.value })}
        />
      </div>
    </div>
  );
}
