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
import { slugify } from "@/lib/utils";

interface NewPropertyDialogProps {
  open: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (payload: { name: string; slug: string }) => void;
}

export function NewPropertyDialog({ open, isLoading, onClose, onConfirm }: NewPropertyDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New property</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <TextField
            id="new_property_name"
            label="Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
          <TextField
            id="new_property_slug"
            label="Slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            disabled={isLoading || !name.trim() || !slug.trim()}
            onClick={() => onConfirm({ name: name.trim(), slug: slug.trim() })}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
