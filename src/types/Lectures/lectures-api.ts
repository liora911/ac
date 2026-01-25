/**
 * API types for lectures routes
 */

/**
 * Formatted lecture data returned by formatLecture function.
 * Used in TreeCategory structure.
 */
export interface FormattedLecture {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  duration: string;
  date?: string;
  bannerImageUrl?: string;
  isPremium: boolean;
  author: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  createdAt: Date;
}

/**
 * Tree structure for lecture categories.
 * Used to build hierarchical category tree with lectures.
 */
export type LectureTreeCategory = {
  id: string;
  name: string;
  bannerImageUrl?: string;
  parentId: string | null;
  lectures: FormattedLecture[];
  subcategories: LectureTreeCategory[];
};
