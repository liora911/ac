/**
 * API types for presentations routes
 */

/**
 * Presentation with author info (without full category).
 * Used in tree structure where category is already the parent node.
 */
export type PresentationWithAuthor = {
  id: string;
  title: string;
  description: string;
  content: string;
  googleSlidesUrl?: string | null;
  pdfUrl?: string | null;
  imageUrls: string[];
  published: boolean;
  isPremium: boolean;
  categoryId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

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
  presentations: PresentationWithAuthor[];
  subcategories: PresentationTreeCategory[];
};
