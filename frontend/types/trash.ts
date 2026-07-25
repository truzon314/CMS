export type TrashEntityType = "blog_post" | "property" | "media";

export interface TrashItem {
  entity_type: TrashEntityType;
  id: string;
  title: string;
  deleted_at: string;
}
