import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { TextField } from "@/components/forms/TextField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { TestimonialItem, TestimonialsConfig } from "@/types/blockConfigs";

interface Props {
  config: TestimonialsConfig;
  onChange: (config: TestimonialsConfig) => void;
}

export function TestimonialsBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="testimonials_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />

      <RepeatableItemList<TestimonialItem>
        items={config.items}
        onChange={(items) => onChange({ ...config, items })}
        newItem={() => ({ name: "", role: "", quote: "", avatar_url: "", avatar_media_id: null, rating: 5 })}
        addLabel="Add testimonial"
        itemLabel={(i) => `Testimonial ${i + 1}`}
        renderItem={(item, update, index) => (
          <>
            <TextField id={`testimonial_name_${index}`} label="Name" value={item.name} onChange={(e) => update({ name: e.target.value })} />
            <TextField id={`testimonial_role_${index}`} label="Role" value={item.role} onChange={(e) => update({ role: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`testimonial_quote_${index}`}>Quote</Label>
              <Textarea id={`testimonial_quote_${index}`} rows={3} value={item.quote} onChange={(e) => update({ quote: e.target.value })} />
            </div>
            <ImagePickerField
              label="Avatar"
              imageUrl={item.avatar_url}
              onChange={({ url, mediaId }) => update({ avatar_url: url, avatar_media_id: mediaId })}
            />
            <TextField
              id={`testimonial_rating_${index}`}
              label="Rating (1-5)"
              type="number"
              min={1}
              max={5}
              value={item.rating}
              onChange={(e) => update({ rating: Number(e.target.value) })}
            />
          </>
        )}
      />
    </div>
  );
}
