export interface Media {
  id: string;
  file_name: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  folder_id: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

export interface MediaUsage {
  id: string;
  entity_type: string;
  entity_id: string;
  field_name: string;
}
