import type { Presentation } from "./presentations";

/**
 * API types for presentations routes
 */

/**
 * Tree structure for presentation categories.
 * Used to build hierarchical category tree with presentations.
 */
export type PresentationTreeCategory = {
  id: string;
  name: string;
  bannerImageUrl: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  presentations: Presentation[];
  subcategories: PresentationTreeCategory[];
};
