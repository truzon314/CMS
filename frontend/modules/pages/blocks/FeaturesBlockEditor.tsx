import { TextField } from "@/components/forms/TextField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { FeatureItem, FeaturesConfig } from "@/types/blockConfigs";

interface Props {
  config: FeaturesConfig;
  onChange: (config: FeaturesConfig) => void;
}

export function FeaturesBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="features_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />

      <RepeatableItemList<FeatureItem>
        items={config.items}
        onChange={(items) => onChange({ ...config, items })}
        newItem={() => ({ icon: "", title: "", description: "" })}
        addLabel="Add feature"
        itemLabel={(i) => `Feature ${i + 1}`}
        renderItem={(item, update, index) => (
          <>
            <TextField
              id={`feature_icon_${index}`}
              label="Icon (lucide icon name, e.g. shield-check)"
              value={item.icon}
              onChange={(e) => update({ icon: e.target.value })}
            />
            <TextField id={`feature_title_${index}`} label="Title" value={item.title} onChange={(e) => update({ title: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`feature_description_${index}`}>Description</Label>
              <Textarea
                id={`feature_description_${index}`}
                rows={2}
                value={item.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            </div>
          </>
        )}
      />
    </div>
  );
}
