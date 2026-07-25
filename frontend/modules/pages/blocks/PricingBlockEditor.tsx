import { TextField } from "@/components/forms/TextField";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { PricingConfig, PricingPlan } from "@/types/blockConfigs";

interface Props {
  config: PricingConfig;
  onChange: (config: PricingConfig) => void;
}

export function PricingBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="pricing_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />

      <RepeatableItemList<PricingPlan>
        items={config.plans}
        onChange={(plans) => onChange({ ...config, plans })}
        newItem={() => ({
          name: "",
          price: "",
          period: "",
          features: [],
          button_label: "",
          button_href: "",
          is_featured: false,
        })}
        addLabel="Add plan"
        itemLabel={(i) => `Plan ${i + 1}`}
        renderItem={(item, update, index) => (
          <>
            <TextField id={`plan_name_${index}`} label="Plan name" value={item.name} onChange={(e) => update({ name: e.target.value })} />
            <TextField id={`plan_price_${index}`} label="Price" value={item.price} onChange={(e) => update({ price: e.target.value })} />
            <TextField id={`plan_period_${index}`} label="Period (e.g. /month)" value={item.period} onChange={(e) => update({ period: e.target.value })} />
            <TextField
              id={`plan_features_${index}`}
              label="Features (comma separated)"
              value={item.features.join(", ")}
              onChange={(e) =>
                update({ features: e.target.value.split(",").map((f) => f.trim()).filter(Boolean) })
              }
            />
            <TextField
              id={`plan_button_label_${index}`}
              label="Button label"
              value={item.button_label}
              onChange={(e) => update({ button_label: e.target.value })}
            />
            <TextField
              id={`plan_button_href_${index}`}
              label="Button link"
              value={item.button_href}
              onChange={(e) => update({ button_href: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id={`plan_featured_${index}`}
                checked={item.is_featured}
                onCheckedChange={(checked) => update({ is_featured: checked === true })}
              />
              <Label htmlFor={`plan_featured_${index}`}>Highlight as featured plan</Label>
            </div>
          </>
        )}
      />
    </div>
  );
}
