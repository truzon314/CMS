import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  error?: string;
  id?: string;
  // For toolbar-style filters that intentionally render no visible `label`
  // (the placeholder communicates intent visually) — gives the trigger a
  // real accessible name instead of an empty one.
  ariaLabel?: string;
}

export function SelectField({ label, value, onChange, options, placeholder, error, id, ariaLabel }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Select value={value} onValueChange={(next) => onChange(next ?? "")}>
        <SelectTrigger id={id} aria-label={ariaLabel} className="w-full" aria-invalid={!!error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
