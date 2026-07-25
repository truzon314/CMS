"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBlockDefinitions } from "@/hooks/usePages";

interface BlockPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (blockDefinitionId: string) => void;
}

export function BlockPalette({ open, onClose, onSelect }: BlockPaletteProps) {
  const { data: definitions } = useBlockDefinitions();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a block</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(definitions ?? []).map((def) => (
            <button
              key={def.id}
              type="button"
              onClick={() => {
                onSelect(def.id);
                onClose();
              }}
              className="flex flex-col items-center gap-1 rounded-md border p-3 text-center text-xs hover:border-neutral-400"
            >
              <span className="font-medium">{def.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
