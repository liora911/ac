/**
 * Category types used across the application
 */

export type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
};
