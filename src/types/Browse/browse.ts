// Types for the Browse/Sitemap page showing all categories and content

export interface ContentCounts {
  articles: number;
  lectures: number;
  presentations: number;
  events: number;
  total: number;
}

export interface BrowseCategoryItem {
  id: string;
  name: string;
  bannerImageUrl: string | null;
  parentId: string | null;
  counts: ContentCounts;
  subcategories: BrowseCategoryItem[];
}

export interface BrowseData {
  categories: BrowseCategoryItem[];
  totalCounts: ContentCounts;
}
