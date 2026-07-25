export type CategoryAppliesTo = "blog" | "property" | "both";

export interface Category {
  id: string;
  name: string;
  slug: string;
  applies_to: CategoryAppliesTo;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}
