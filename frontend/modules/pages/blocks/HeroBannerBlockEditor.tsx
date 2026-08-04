import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { TextField } from "@/components/forms/TextField";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { HeroBannerConfig, HeroSlideItem } from "@/types/blockConfigs";

interface Props {
  config: HeroBannerConfig;
  onChange: (config: HeroBannerConfig) => void;
}

/** my-app's Hero rotates through `slides` behind one shared button — not a
 * single static banner. Button fields are shared across every slide since
 * that's how the public site actually renders it. */
export function HeroBannerBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="hero_button_label"
        label="Button label"
        value={config.button_label}
        onChange={(e) => onChange({ ...config, button_label: e.target.value })}
      />
      <TextField
        id="hero_button_href"
        label="Button link"
        value={config.button_href}
        onChange={(e) => onChange({ ...config, button_href: e.target.value })}
      />

      <RepeatableItemList<HeroSlideItem>
        items={config.slides}
        onChange={(slides) => onChange({ ...config, slides })}
        newItem={() => ({ heading: "", subheading: "", image_url: "", image_media_id: null })}
        addLabel="Add slide"
        itemLabel={(i) => `Slide ${i + 1}`}
        renderItem={(item, update, index) => (
          <>
            <TextField
              id={`hero_slide_heading_${index}`}
              label="Heading"
              value={item.heading}
              onChange={(e) => update({ heading: e.target.value })}
            />
            <TextField
              id={`hero_slide_subheading_${index}`}
              label="Subheading"
              value={item.subheading}
              onChange={(e) => update({ subheading: e.target.value })}
            />
            <ImagePickerField
              label="Background image"
              recommendedDimensions="1920 × 1080 px (16:9, full-bleed)"
              imageUrl={item.image_url}
              onChange={({ url, mediaId }) => update({ image_url: url, image_media_id: mediaId })}
            />
          </>
        )}
      />
    </div>
  );
}
