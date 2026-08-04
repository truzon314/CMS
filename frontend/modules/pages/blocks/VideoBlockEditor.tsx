import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { TextField } from "@/components/forms/TextField";
import type { VideoConfig } from "@/types/blockConfigs";

interface Props {
  config: VideoConfig;
  onChange: (config: VideoConfig) => void;
}

export function VideoBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <TextField
        id="video_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />
      <TextField
        id="video_url"
        label="Video URL"
        placeholder="YouTube/Vimeo embed URL, or an uploaded .mp4"
        value={config.video_url}
        onChange={(e) => onChange({ ...config, video_url: e.target.value })}
      />
      <ImagePickerField
        label="Poster image (optional)"
        recommendedDimensions="1280 × 720 px (16:9)"
        imageUrl={config.poster_image_url}
        onChange={({ url, mediaId }) =>
          onChange({ ...config, poster_image_url: url, poster_image_media_id: mediaId })
        }
      />
    </div>
  );
}
