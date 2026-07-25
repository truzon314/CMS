import { TextField } from "@/components/forms/TextField";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { StatisticItem, StatisticsConfig } from "@/types/blockConfigs";

interface Props {
  config: StatisticsConfig;
  onChange: (config: StatisticsConfig) => void;
}

export function StatisticsBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="statistics_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />

      <RepeatableItemList<StatisticItem>
        items={config.items}
        onChange={(items) => onChange({ ...config, items })}
        newItem={() => ({ label: "", value: "", suffix: "" })}
        addLabel="Add statistic"
        itemLabel={(i) => `Statistic ${i + 1}`}
        renderItem={(item, update, index) => (
          <>
            <TextField id={`stat_value_${index}`} label="Value (e.g. 250)" value={item.value} onChange={(e) => update({ value: e.target.value })} />
            <TextField id={`stat_suffix_${index}`} label="Suffix (e.g. +, %)" value={item.suffix} onChange={(e) => update({ suffix: e.target.value })} />
            <TextField id={`stat_label_${index}`} label="Label (e.g. Projects Delivered)" value={item.label} onChange={(e) => update({ label: e.target.value })} />
          </>
        )}
      />
    </div>
  );
}
