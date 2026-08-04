"use client";

import { useEffect, useState } from "react";
import { AppDrawer } from "@/components/ui/app-drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateCareer, useDeleteCareer, useUpdateCareer } from "@/hooks/useCareers";
import type { Career } from "@/types/career";

interface CareerDrawerProps {
  career: Career | null;
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  title: "",
  department: "",
  location: "",
  employment_type: "",
  description: "",
  apply_email: "",
  is_published: false,
};

export function CareerDrawer({ career, open, onClose }: CareerDrawerProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const create = useCreateCareer();
  const update = useUpdateCareer();
  const remove = useDeleteCareer();

  useEffect(() => {
    setForm(
      career
        ? {
            title: career.title,
            department: career.department ?? "",
            location: career.location ?? "",
            employment_type: career.employment_type ?? "",
            description: career.description,
            apply_email: career.apply_email ?? "",
            is_published: career.is_published,
          }
        : EMPTY_FORM
    );
  }, [career, open]);

  function handleSave() {
    const payload = {
      title: form.title.trim(),
      department: form.department.trim() || null,
      location: form.location.trim() || null,
      employment_type: form.employment_type.trim() || null,
      description: form.description.trim(),
      apply_email: form.apply_email.trim() || null,
      is_published: form.is_published,
    };
    if (career) {
      update.mutate({ id: career.id, payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  }

  function handleDelete() {
    if (!career) return;
    remove.mutate(career.id, { onSuccess: onClose });
  }

  const saving = create.isPending || update.isPending;

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={career ? "Edit Career Posting" : "New Career Posting"}
      width="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {career ? (
            <Button variant="destructive" onClick={handleDelete} disabled={remove.isPending}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.description.trim()}>
            {career ? "Save" : "Create"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="career_title">Title</Label>
          <Input id="career_title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="career_department">Department</Label>
            <Input
              id="career_department"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="career_location">Location</Label>
            <Input
              id="career_location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="career_employment_type">Employment Type</Label>
          <Input
            id="career_employment_type"
            placeholder="e.g. Full-time"
            value={form.employment_type}
            onChange={(e) => setForm((f) => ({ ...f, employment_type: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="career_description">Description</Label>
          <Textarea
            id="career_description"
            rows={6}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="career_apply_email">Apply Email</Label>
          <Input
            id="career_apply_email"
            type="email"
            value={form.apply_email}
            onChange={(e) => setForm((f) => ({ ...f, apply_email: e.target.value }))}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="career_is_published"
            checked={form.is_published}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, is_published: checked === true }))}
          />
          <Label htmlFor="career_is_published" className="font-normal">
            Published
          </Label>
        </div>
      </div>
    </AppDrawer>
  );
}
