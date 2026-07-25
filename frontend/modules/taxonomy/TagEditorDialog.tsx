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
import type { Tag } from "@/types/taxonomy";

interface TagEditorDialogProps {
  open: boolean;
  isLoading?: boolean;
  tag?: Tag | null;
  onClose: () => void;
  onSave: (payload: { name: string; slug: string }) => void;
}

export function TagEditorDialog({ open, isLoading, tag, onClose, onSave }: TagEditorDialogProps) {
  const [name, setName] = useState(tag?.name ?? "");
  const [slug, setSlug] = useState(tag?.slug ?? "");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tag ? "Edit tag" : "New tag"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <TextField id="tag_name" label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField id="tag_slug" label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            disabled={isLoading || !name.trim() || !slug.trim()}
            onClick={() => onSave({ name: name.trim(), slug: slug.trim() })}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
