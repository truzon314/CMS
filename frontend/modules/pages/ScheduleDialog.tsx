"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";

interface ScheduleDialogProps {
  open: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (scheduledAtIso: string) => void;
}

export function ScheduleDialog({ open, isLoading, onClose, onConfirm }: ScheduleDialogProps) {
  const [value, setValue] = useState("");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule publish</DialogTitle>
          <DialogDescription>Pick when this page should go live.</DialogDescription>
        </DialogHeader>
        <TextField
          id="scheduled_at"
          label="Date & time"
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            disabled={isLoading || !value}
            onClick={() => onConfirm(new Date(value).toISOString())}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
