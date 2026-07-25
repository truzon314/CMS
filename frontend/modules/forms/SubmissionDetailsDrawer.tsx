"use client";

import { AppDrawer } from "@/components/ui/app-drawer";
import { SelectField } from "@/components/forms/SelectField";
import { StatusPill } from "@/components/ui/status-pill";
import { useUpdateFormSubmission } from "@/hooks/useFormSubmissions";
import { useUsers } from "@/hooks/useUsers";
import type { FormSubmission, FormSubmissionStatus } from "@/types/formSubmission";

interface SubmissionDetailsDrawerProps {
  submission: FormSubmission | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

export function SubmissionDetailsDrawer({ submission, open, onClose }: SubmissionDetailsDrawerProps) {
  const { data: usersPage } = useUsers({});
  const update = useUpdateFormSubmission();

  if (!submission) return null;

  const userOptions = [
    { value: "", label: "Unassigned" },
    ...(usersPage?.data ?? []).map((u) => ({ value: u.id, label: u.full_name })),
  ];

  return (
    <AppDrawer open={open} onClose={onClose} title={submission.name} width="md">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center gap-2">
          <StatusPill status={submission.status} />
          <span className="text-xs text-neutral-500">
            {new Date(submission.submitted_at).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-neutral-500">Form</span>
          <span>{submission.form_key}</span>
          <span className="text-neutral-500">Email</span>
          <span>{submission.email ?? "—"}</span>
          <span className="text-neutral-500">Phone</span>
          <span>{submission.phone ?? "—"}</span>
          <span className="text-neutral-500">Interested in</span>
          <span>{submission.property_type_interest ?? "—"}</span>
        </div>

        {submission.message ? (
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Message</div>
            <p className="text-sm text-neutral-700">{submission.message}</p>
          </div>
        ) : null}

        <SelectField
          id="submission_status"
          label="Status"
          value={submission.status}
          onChange={(v) => update.mutate({ id: submission.id, payload: { status: v as FormSubmissionStatus } })}
          options={STATUS_OPTIONS}
        />

        <SelectField
          id="submission_assigned_to"
          label="Assigned to"
          value={submission.assigned_to ?? ""}
          onChange={(v) => update.mutate({ id: submission.id, payload: { assigned_to: v || null } })}
          options={userOptions}
        />
      </div>
    </AppDrawer>
  );
}
