import { useState } from "react";
import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { HeroBannerConfig, HeroSlideItem } from "@/types/blockConfigs";

interface Props {
  config: HeroBannerConfig;
  onChange: (config: HeroBannerConfig) => void;
}

type ImageTarget = "desktop" | "mobile";

/** Which of a slide's two images is currently shown — purely a local editing
 * toggle, not part of the saved config, so it's a real component (not an
 * inline callback in RepeatableItemList's .map) to hold its own state per
 * slide without breaking React's rules of hooks as slides are added/removed. */
function HeroSlideFields({
  item,
  update,
  index,
}: {
  item: HeroSlideItem;
  update: (patch: Partial<HeroSlideItem>) => void;
  index: number;
}) {
  const [target, setTarget] = useState<ImageTarget>("desktop");

  return (
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

      <SelectField
        id={`hero_slide_image_target_${index}`}
        label="Image for"
        value={target}
        onChange={(value) => setTarget(value as ImageTarget)}
        options={[
          { value: "desktop", label: "Desktop" },
          { value: "mobile", label: "Mobile & Tablet" },
        ]}
      />

      {target === "desktop" ? (
        <ImagePickerField
          label="Background image (Desktop)"
          recommendedDimensions="1920 × 1080 px (16:9, full-bleed)"
          imageUrl={item.image_url}
          onChange={({ url, mediaId }) => update({ image_url: url, image_media_id: mediaId })}
        />
      ) : (
        <ImagePickerField
          label="Background image (Mobile & Tablet)"
          recommendedDimensions="1080 × 1440 px (3:4, portrait) — falls back to the desktop image above if left blank"
          imageUrl={item.mobile_image_url ?? ""}
          onChange={({ url, mediaId }) => update({ mobile_image_url: url, mobile_image_media_id: mediaId })}
        />
      )}
    </>
  );
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
        newItem={() => ({
          heading: "",
          subheading: "",
          image_url: "",
          image_media_id: null,
          mobile_image_url: "",
          mobile_image_media_id: null,
        })}
        addLabel="Add slide"
        itemLabel={(i) => `Slide ${i + 1}`}
        renderItem={(item, update, index) => <HeroSlideFields item={item} update={update} index={index} />}
      />
    </div>
  );
}
