export interface GalleryItem {
  id: string;
  media_id: string;
  caption: string | null;
  category: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
