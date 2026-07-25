import { Checkbox } from "@/components/ui/checkbox";

export interface PermissionOption {
  id: string;
  key: string;
  module: string;
}

interface PermissionMatrixProps {
  permissions: PermissionOption[];
  selectedIds: Set<string>;
  onChange: (nextSelectedIds: Set<string>) => void;
  readOnly?: boolean;
}

export function PermissionMatrix({ permissions, selectedIds, onChange, readOnly }: PermissionMatrixProps) {
  const grouped = permissions.reduce<Record<string, PermissionOption[]>>((acc, perm) => {
    (acc[perm.module] ??= []).push(perm);
    return acc;
  }, {});

  function toggle(id: string) {
    if (readOnly) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-5">
      {Object.entries(grouped).map(([module, perms]) => (
        <div key={module}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {module}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {perms.map((perm) => (
              <label
                key={perm.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:disabled]:opacity-60"
              >
                <Checkbox
                  checked={selectedIds.has(perm.id)}
                  onCheckedChange={() => toggle(perm.id)}
                  disabled={readOnly}
                />
                {perm.key}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
