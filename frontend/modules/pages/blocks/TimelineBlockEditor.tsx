import { TextField } from "@/components/forms/TextField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { TimelineConfig, TimelineItem } from "@/types/blockConfigs";

interface Props {
  config: TimelineConfig;
  onChange: (config: TimelineConfig) => void;
}

export function TimelineBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="timeline_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />

      <RepeatableItemList<TimelineItem>
        items={config.items}
        onChange={(items) => onChange({ ...config, items })}
        newItem={() => ({ year: "", title: "", description: "" })}
        addLabel="Add milestone"
        itemLabel={(i) => `Milestone ${i + 1}`}
        renderItem={(item, update, index) => (
          <>
            <TextField id={`timeline_year_${index}`} label="Year" value={item.year} onChange={(e) => update({ year: e.target.value })} />
            <TextField id={`timeline_title_${index}`} label="Title" value={item.title} onChange={(e) => update({ title: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`timeline_description_${index}`}>Description</Label>
              <Textarea
                id={`timeline_description_${index}`}
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
