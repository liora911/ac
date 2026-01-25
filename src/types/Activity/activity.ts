/**
 * Activity feed types
 */

export interface ActivityItem {
  id: string;
  rawId: string;
  slug?: string;
  type: "article" | "event" | "lecture" | "presentation";
  title: string;
  action: "created" | "updated";
  timestamp: string;
  author: string;
}
