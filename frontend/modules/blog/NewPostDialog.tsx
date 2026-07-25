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

interface NewPostDialogProps {
  open: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (payload: { title: string; slug: string }) => void;
}

export function NewPostDialog({ open, isLoading, onClose, onConfirm }: NewPostDialogProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New blog post</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <TextField
            id="new_post_title"
            label="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
          <TextField
            id="new_post_slug"
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
            disabled={isLoading || !title.trim() || !slug.trim()}
            onClick={() => onConfirm({ title: title.trim(), slug: slug.trim() })}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
