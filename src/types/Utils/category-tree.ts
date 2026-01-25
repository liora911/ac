/**
 * Base interface for category data from Prisma
 */
export interface BasePrismaCategory {
  id: string;
  name: string;
  bannerImageUrl?: string | null;
  parentId: string | null;
}

/**
 * Tree category interface with generic items type
 */
export interface TreeCategory<T> {
  id: string;
  name: string;
  bannerImageUrl?: string;
  parentId: string | null;
  items: T[];
  subcategories: TreeCategory<T>[];
}

/**
 * Options for building category tree
 */
export interface BuildCategoryTreeOptions<TCategory, TItem, TFormattedItem> {
  /** The Prisma categories with their items */
  categories: TCategory[];
  /** Function to get the category's items array */
  getItems: (category: TCategory) => readonly TItem[];
  /** Function to format an item */
  formatItem: (item: TItem) => TFormattedItem;
  /** Property name for items in the result (for backwards compatibility) */
  itemsKey?: string;
}
