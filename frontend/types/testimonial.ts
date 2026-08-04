export interface Testimonial {
  id: string;
  name: string;
  role_or_location: string | null;
  quote: string;
  photo_media_id: string | null;
  rating: number | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
