export interface TagCategoryPayload {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  order: number | null;
  tagIds?: number[];
}
