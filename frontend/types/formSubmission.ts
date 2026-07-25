export type FormSubmissionStatus = "new" | "contacted" | "closed";

export interface FormSubmission {
  id: string;
  form_key: string;
  name: string;
  phone: string | null;
  email: string | null;
  property_type_interest: string | null;
  message: string | null;
  status: FormSubmissionStatus;
  assigned_to: string | null;
  ip_address: string | null;
  submitted_at: string;
}
