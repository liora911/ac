import type { BasePrismaCategory, TreeCategory, BuildCategoryTreeOptions } from "@/types/Utils/category-tree";

export type { BasePrismaCategory, TreeCategory, BuildCategoryTreeOptions };

/**
 * Build a hierarchical category tree from flat Prisma categories.
 * Filters out empty categories (no items and no subcategories with items).
 *
 * @param options - Configuration options
 * @returns Array of root categories with nested subcategories
 *
 * @example
 * // For lectures
 * const tree = buildCategoryTree({
 *   categories: prismaCategories,
 *   getItems: (cat) => cat.lectures,
 *   formatItem: formatLecture,
 * });
 *
 * @example
 * // For presentations
 * const tree = buildCategoryTree({
 *   categories: prismaCategories,
 *   getItems: (cat) => cat.presentations,
 *   formatItem: formatPresentation,
 * });
 */
export function buildCategoryTree<
  TCategory extends BasePrismaCategory,
  TItem,
  TFormattedItem
>(
  options: BuildCategoryTreeOptions<TCategory, TItem, TFormattedItem>
): TreeCategory<TFormattedItem>[] {
  const { categories, getItems, formatItem } = options;

  const byId = new Map<string, TreeCategory<TFormattedItem>>();

  // First pass: create all tree nodes
  categories.forEach((cat) => {
    const items = getItems(cat);
    byId.set(cat.id, {
      id: cat.id,
      name: cat.name,
      bannerImageUrl: cat.bannerImageUrl || undefined,
      parentId: cat.parentId,
      items: items.map(formatItem),
      subcategories: [],
    });
  });

  // Second pass: build the tree structure
  const roots: TreeCategory<TFormattedItem>[] = [];

  byId.forEach((cat) => {
    if (cat.parentId && byId.has(cat.parentId)) {
      const parent = byId.get(cat.parentId)!;
      parent.subcategories.push(cat);
    } else {
      roots.push(cat);
    }
  });

  // Filter out empty categories
  return filterEmptyCategories(roots);
}

/**
 * Recursively filter out categories with no items and no subcategories
 */
function filterEmptyCategories<T>(
  categories: TreeCategory<T>[]
): TreeCategory<T>[] {
  return categories
    .map((cat) => ({
      ...cat,
      subcategories: filterEmptyCategories(cat.subcategories),
    }))
    .filter((cat) => cat.items.length > 0 || cat.subcategories.length > 0);
}

/**
 * Get total item count in a category including all subcategories
 *
 * @param category - The category to count items for
 * @returns Total number of items
 */
export function getTotalItemCount<T>(category: TreeCategory<T>): number {
  let count = category.items.length;
  for (const sub of category.subcategories) {
    count += getTotalItemCount(sub);
  }
  return count;
}

/**
 * Flatten a category tree into a flat array of categories
 * Useful for search or listing all categories
 *
 * @param categories - Root categories
 * @returns Flat array of all categories
 */
export function flattenCategoryTree<T>(
  categories: TreeCategory<T>[]
): TreeCategory<T>[] {
  const result: TreeCategory<T>[] = [];

  function traverse(cats: TreeCategory<T>[]) {
    for (const cat of cats) {
      result.push(cat);
      traverse(cat.subcategories);
    }
  }

  traverse(categories);
  return result;
}

/**
 * Find a category by ID in the tree
 *
 * @param categories - Root categories
 * @param id - Category ID to find
 * @returns The category or undefined
 */
export function findCategoryById<T>(
  categories: TreeCategory<T>[],
  id: string
): TreeCategory<T> | undefined {
  for (const cat of categories) {
    if (cat.id === id) return cat;
    const found = findCategoryById(cat.subcategories, id);
    if (found) return found;
  }
  return undefined;
}
