import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { TextField } from "@/components/forms/TextField";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { GalleryConfig, GalleryImage } from "@/types/blockConfigs";

interface Props {
  config: GalleryConfig;
  onChange: (config: GalleryConfig) => void;
}

export function GalleryBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="gallery_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />

      <RepeatableItemList<GalleryImage>
        items={config.images}
        onChange={(images) => onChange({ ...config, images })}
        newItem={() => ({ url: "", media_id: null, alt_text: "", caption: "" })}
        addLabel="Add image"
        itemLabel={(i) => `Image ${i + 1}`}
        renderItem={(item, update, index) => (
          <>
            <ImagePickerField
              label="Image"
              recommendedDimensions="1200 × 900 px (4:3)"
              imageUrl={item.url}
              onChange={({ url, mediaId }) => update({ url, media_id: mediaId })}
            />
            <TextField
              id={`gallery_alt_${index}`}
              label="Alt text"
              value={item.alt_text}
              onChange={(e) => update({ alt_text: e.target.value })}
            />
            <TextField
              id={`gallery_caption_${index}`}
              label="Caption"
              value={item.caption}
              onChange={(e) => update({ caption: e.target.value })}
            />
          </>
        )}
      />
    </div>
  );
}
