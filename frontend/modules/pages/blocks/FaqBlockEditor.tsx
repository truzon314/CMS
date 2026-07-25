import { Plus, Trash2 } from "lucide-react";
import { TextField } from "@/components/forms/TextField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { FaqConfig } from "@/types/blockConfigs";

interface Props {
  config: FaqConfig;
  onChange: (config: FaqConfig) => void;
}

export function FaqBlockEditor({ config, onChange }: Props) {
  function updateItem(index: number, field: "q" | "a", value: string) {
    const items = config.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange({ ...config, items });
  }

  function removeItem(index: number) {
    onChange({ ...config, items: config.items.filter((_, i) => i !== index) });
  }

  function addItem() {
    onChange({ ...config, items: [...config.items, { q: "", a: "" }] });
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="faq_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />

      <div className="flex flex-col gap-3">
        {config.items.map((item, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Question {index + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-neutral-400 hover:text-destructive"
                aria-label={`Remove question ${index + 1}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <TextField
              id={`faq_question_${index}`}
              label="Question"
              value={item.q}
              onChange={(e) => updateItem(index, "q", e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`faq_answer_${index}`}>Answer</Label>
              <Textarea
                id={`faq_answer_${index}`}
                value={item.a}
                onChange={(e) => updateItem(index, "a", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addItem}>
        <Plus size={14} />
        Add question
      </Button>
    </div>
  );
}
