import { Badge } from "@/components/ui/badge";
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

// Semantic status color, kept separate from the brand accent (REUSABLE_COMPONENTS.md).
const VARIANTS: Record<Status, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  scheduled: "outline",
  published: "default",
  unpublished: "secondary",
  new: "default",
  contacted: "outline",
  closed: "secondary",
};

export function StatusPill({ status }: { status: Status }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
