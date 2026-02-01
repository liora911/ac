/**
 * Category types used across the application
 */

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
}

// Alias for backwards compatibility
export type CategoryNode = Category;
