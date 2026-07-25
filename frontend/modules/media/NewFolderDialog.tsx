"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";

interface NewFolderDialogProps {
  open: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function NewFolderDialog({ open, isLoading, onClose, onConfirm }: NewFolderDialogProps) {
  const [name, setName] = useState("");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
        <TextField id="folder_name" label="Folder name" value={name} onChange={(e) => setName(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button disabled={isLoading || !name.trim()} onClick={() => onConfirm(name.trim())}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
