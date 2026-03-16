import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export interface RecentlyReadArticle {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;
  articleImage?: string;
  publisherName?: string;
  readTime: number;
  isPremium: boolean;
  isFeatured: boolean;
  createdAt: string;
  authors?: { id: string; name: string; imageUrl?: string | null; order: number }[];
  category?: { id: string; name: string };
  categories?: { id: string; name: string }[];
  viewedAt: string;
}

async function fetchRecentlyRead(): Promise<RecentlyReadArticle[]> {
  const res = await fetch("/api/articles/views");
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export function useRecentlyRead() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["recently-read", session?.user?.id],
    queryFn: fetchRecentlyRead,
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
