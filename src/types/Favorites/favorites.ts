export type FavoriteType = "ARTICLE" | "LECTURE" | "PRESENTATION";

export interface FavoriteIds {
  articles: string[];
  lectures: string[];
  presentations: string[];
}

export interface FavoritesFull {
  articles: Array<{
    id: string;
    slug?: string | null;
    title: string;
    articleImage?: string | null;
    publisherName: string;
    readDuration: number;
    isPremium: boolean;
    createdAt: string;
    category?: { id: string; name: string } | null;
    authors?: Array<{ id: string; name: string; imageUrl?: string | null }>;
  }>;
  lectures: Array<{
    id: string;
    title: string;
    description: string;
    bannerImageUrl?: string | null;
    videoUrl?: string | null;
    duration: string;
    isPremium: boolean;
    createdAt: string;
    category: { id: string; name: string };
  }>;
  presentations: Array<{
    id: string;
    title: string;
    description: string;
    imageUrls: string[];
    isPremium: boolean;
    createdAt: string;
    category: { id: string; name: string };
  }>;
  counts: {
    articles: number;
    lectures: number;
    presentations: number;
    total: number;
  };
}
