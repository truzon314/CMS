import type { SeoMeta } from "@/types/page";
import type { Category } from "@/types/taxonomy";

export type BudgetBracket = "under2" | "2to5" | "5to10" | "10plus";
export type PropertyStatus = "draft" | "published";

export interface PropertyMediaItem {
  media_id: string;
  position: number;
}

export interface PropertyAmenity {
  name: string;
  image_media_id: string | null;
}

export interface PropertyListItem {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  category_names: string[];
  price_display: string | null;
  status: PropertyStatus;
  sort_order: number;
  updated_at: string;
}

export interface Property {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  location_text: string | null;
  price_display: string | null;
  price_value: string | null;
  budget_bracket: BudgetBracket | null;
  spec_a: string | null;
  spec_b: string | null;
  area_sqft: string | null;
  beds_options: string[] | null;
  description: string | null;
  amenities: PropertyAmenity[] | null;
  tag_text: string | null;
  status_text: string | null;
  is_signature: boolean;
  featured_image_media_id: string | null;
  brochure_media_id: string | null;
  seo: SeoMeta | null;
  status: PropertyStatus;
  sort_order: number;
  map_project_id: string | null;
  categories: Category[];
  gallery: PropertyMediaItem[];
  created_at: string;
  updated_at: string;

  // Extended Cinematic & Conversion Fields
  hero_media_type?: "video" | "image" | "carousel";
  desktop_hero_video_url?: string | null;
  mobile_hero_video_url?: string | null;
  desktop_hero_image_id?: string | null;
  mobile_hero_image_id?: string | null;
  poster_image_id?: string | null;
  hero_heading?: string | null;
  hero_subheading?: string | null;
  hero_overlay_strength?: number;
  hero_text_align?: "left" | "center" | "right";
  hero_theme?: "dark" | "light";
  video_experience?: any[];
  master_plan_media_id?: string | null;
  master_plan_title?: string | null;
  master_plan_description?: string | null;
  floor_plans?: any[];
  location_landmarks?: any[];
  highlights?: any[];
  offers?: any[];
  construction_updates?: any[];
  sections?: any[];
  rera_number?: string | null;
  approval_info?: string | null;
  disclaimer_text?: string | null;
  possession_date?: string | null;
}

