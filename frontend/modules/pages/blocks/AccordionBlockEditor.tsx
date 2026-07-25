import { TextField } from "@/components/forms/TextField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { AccordionConfig, AccordionItem } from "@/types/blockConfigs";

interface Props {
  config: AccordionConfig;
  onChange: (config: AccordionConfig) => void;
}

export function AccordionBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="accordion_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />

      <RepeatableItemList<AccordionItem>
        items={config.items}
        onChange={(items) => onChange({ ...config, items })}
        newItem={() => ({ title: "", content: "" })}
        addLabel="Add item"
        itemLabel={(i) => `Item ${i + 1}`}
        renderItem={(item, update, index) => (
          <>
            <TextField id={`accordion_title_${index}`} label="Title" value={item.title} onChange={(e) => update({ title: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`accordion_content_${index}`}>Content</Label>
              <Textarea
                id={`accordion_content_${index}`}
                rows={3}
                value={item.content}
                onChange={(e) => update({ content: e.target.value })}
              />
            </div>
          </>
        )}
      />
    </div>
  );
}
