export type PageType = "home" | "about" | "projects" | "blog" | "contact";
export type PageStatus = "draft" | "scheduled" | "published" | "unpublished";

export interface SeoMeta {
  id: string;
  seo_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  keywords: string[] | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_media_id: string | null;
  twitter_card_type: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image_media_id: string | null;
  robots: string | null;
  schema_jsonld: Record<string, unknown> | null;
}

export interface BlockDefinition {
  id: string;
  key: string;
  label: string;
  is_active: boolean;
}

export interface PageBlock {
  id: string;
  block_definition_id: string;
  position: number;
  config: Record<string, unknown>;
}

export interface Page {
  id: string;
  page_type: PageType;
  slug: string;
  title: string;
  status: PageStatus;
  published_at: string | null;
  scheduled_at: string | null;
  seo: SeoMeta | null;
  blocks: PageBlock[];
  updated_at: string;
}

export interface PageListItem {
  id: string;
  page_type: PageType;
  slug: string;
  title: string;
  status: PageStatus;
  updated_at: string;
}

export interface EntityVersion {
  id: string;
  version_number: number;
  change_note: string | null;
  created_by: string;
  created_at: string;
}
