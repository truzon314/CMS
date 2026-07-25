"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { SelectField } from "@/components/forms/SelectField";
import { StatusPill } from "@/components/ui/status-pill";
import { useExportFormSubmissions, useFormSubmissionsList } from "@/hooks/useFormSubmissions";
import { SubmissionDetailsDrawer } from "@/modules/forms/SubmissionDetailsDrawer";
import type { FormSubmission } from "@/types/formSubmission";

const FORM_KEY_OPTIONS = [
  { value: "", label: "All forms" },
  { value: "hero_quick_enquiry", label: "Quick Enquiry" },
  { value: "contact_callback", label: "Request a Callback" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

export function FormSubmissionsListPage() {
  const [formKey, setFormKey] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useFormSubmissionsList({
    formKey: formKey || undefined,
    status: status || undefined,
  });
  const exportCsv = useExportFormSubmissions();

  const submissions = data?.data ?? [];
  const selected = submissions.find((s) => s.id === selectedId) ?? null;

  const columns: ColumnDef<FormSubmission>[] = [
    { id: "name", header: "Name", cell: (s) => s.name },
    { id: "phone", header: "Phone", cell: (s) => s.phone ?? "—" },
    { id: "email", header: "Email", cell: (s) => s.email ?? "—" },
    { id: "form_key", header: "Form", cell: (s) => s.form_key },
    { id: "status", header: "Status", cell: (s) => <StatusPill status={s.status} /> },
    {
      id: "submitted_at",
      header: "Submitted",
      cell: (s) => new Date(s.submitted_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Form Submissions</h1>
        <Button
          variant="outline"
          disabled={exportCsv.isPending}
          onClick={() => exportCsv.mutate({ formKey: formKey || undefined, status: status || undefined })}
        >
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-52">
          <SelectField label="" id="form_key_filter" value={formKey} onChange={setFormKey} options={FORM_KEY_OPTIONS} />
        </div>
        <div className="w-44">
          <SelectField label="" id="status_filter" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={submissions}
        isLoading={isLoading}
        getRowId={(s) => s.id}
        onRowClick={(s) => setSelectedId(s.id)}
        emptyTitle="No submissions yet"
        emptyDescription="Enquiries from the public site will show up here once the Forms API integration lands."
      />

      <SubmissionDetailsDrawer submission={selected} open={!!selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
