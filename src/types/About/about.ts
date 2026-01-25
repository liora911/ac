/**
 * About page types
 */

export interface AboutPageData {
  id: string;
  titleEn: string;
  titleHe: string;
  contentEn: string | null;
  contentHe: string | null;
  imageUrl: string | null;
  published: boolean;
  updatedAt: string;
}
