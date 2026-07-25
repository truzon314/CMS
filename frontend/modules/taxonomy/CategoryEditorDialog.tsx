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
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import type { Category, CategoryAppliesTo } from "@/types/taxonomy";

interface CategoryEditorDialogProps {
  open: boolean;
  isLoading?: boolean;
  category?: Category | null;
  onClose: () => void;
  onSave: (payload: { name: string; slug: string; applies_to: CategoryAppliesTo }) => void;
}

const APPLIES_TO_OPTIONS = [
  { value: "blog", label: "Blog" },
  { value: "property", label: "Property" },
  { value: "both", label: "Both" },
];

export function CategoryEditorDialog({ open, isLoading, category, onClose, onSave }: CategoryEditorDialogProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [appliesTo, setAppliesTo] = useState<CategoryAppliesTo>(category?.applies_to ?? "blog");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <TextField id="category_name" label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField id="category_slug" label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <SelectField
            id="category_applies_to"
            label="Applies to"
            value={appliesTo}
            onChange={(v) => setAppliesTo(v as CategoryAppliesTo)}
            options={APPLIES_TO_OPTIONS}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            disabled={isLoading || !name.trim() || !slug.trim()}
            onClick={() => onSave({ name: name.trim(), slug: slug.trim(), applies_to: appliesTo })}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
