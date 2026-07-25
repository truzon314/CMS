import type { SeoMeta } from "@/types/page";
import type { Category } from "@/types/taxonomy";

export type BudgetBracket = "under2" | "2to5" | "5to10" | "10plus";
export type PropertyStatus = "draft" | "published";

export interface PropertyMediaItem {
  media_id: string;
  position: number;
}

export interface PropertyListItem {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  category_names: string[];
  price_display: string | null;
  status: PropertyStatus;
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
  tag_text: string | null;
  status_text: string | null;
  is_signature: boolean;
  featured_image_media_id: string | null;
  seo: SeoMeta | null;
  status: PropertyStatus;
  categories: Category[];
  gallery: PropertyMediaItem[];
  created_at: string;
  updated_at: string;
}
