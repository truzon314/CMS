import type { SeoMeta } from "@/types/page";
import type { Category, Tag } from "@/types/taxonomy";

export type BlogPostStatus = "draft" | "scheduled" | "published";

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  status: BlogPostStatus;
  author_name: string;
  category_names: string[];
  is_featured: boolean;
  published_at: string | null;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  featured_image_media_id: string | null;
  author_id: string;
  author_name: string;
  status: BlogPostStatus;
  published_at: string | null;
  scheduled_at: string | null;
  reading_time_minutes: number | null;
  is_featured: boolean;
  seo: SeoMeta | null;
  categories: Category[];
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface BlogPostVersion {
  id: string;
  version_number: number;
  change_note: string | null;
  created_by: string;
  created_at: string;
}
