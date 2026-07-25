import type { PageStatus } from "@/types/page";
import type { FormSubmissionStatus } from "@/types/formSubmission";

type Status = PageStatus | FormSubmissionStatus;

const LABELS: Record<Status, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  unpublished: "Unpublished",
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

export function StatusPill({ status }: { status: Status }) {
  if (status === "published" || status === "new") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-0.5 text-xs font-semibold text-[#137333] border border-[#ceead6]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#137333]"></span>
        {LABELS[status]}
      </span>
    );
  }

  if (status === "scheduled" || status === "contacted") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
        {LABELS[status]}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
      {LABELS[status] ?? status}
    </span>
  );
}
