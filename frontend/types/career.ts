export interface Career {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description: string;
  apply_email: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
