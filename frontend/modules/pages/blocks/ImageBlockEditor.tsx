import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { TextField } from "@/components/forms/TextField";
import type { ImageConfig } from "@/types/blockConfigs";

interface Props {
  config: ImageConfig;
  onChange: (config: ImageConfig) => void;
}

export function ImageBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <ImagePickerField
        label="Image"
        recommendedDimensions="1200 × 800 px"
        imageUrl={config.image_url}
        onChange={({ url, mediaId }) => onChange({ ...config, image_url: url, image_media_id: mediaId })}
      />
      <TextField
        id="image_alt"
        label="Alt text"
        value={config.alt_text}
        onChange={(e) => onChange({ ...config, alt_text: e.target.value })}
      />
      <TextField
        id="image_caption"
        label="Caption (optional)"
        value={config.caption}
        onChange={(e) => onChange({ ...config, caption: e.target.value })}
      />
    </div>
  );
}
