import { useQuery } from "@tanstack/react-query";

export type PreviewArticle = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  category?: { id: string; name: string } | null;
};

export type PreviewLecture = {
  id: string;
  title: string;
  description: string;
  date: string | null;
  createdAt: string;
  category?: { id: string; name: string } | null;
};

export type PreviewEvent = {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string | null;
};

export type PreviewPresentation = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  category?: { id: string; name: string } | null;
};

export type HomePreviewData = {
  articles: PreviewArticle[];
  lectures: PreviewLecture[];
  events: PreviewEvent[];
  presentations: PreviewPresentation[];
};

export const homePreviewKeys = {
  all: ["homePreview"] as const,
};

export function useHomePreview() {
  return useQuery<HomePreviewData, Error>({
    queryKey: homePreviewKeys.all,
    queryFn: async () => {
      const response = await fetch("/api/search?q=");
      if (!response.ok) {
        throw new Error("Failed to fetch home preview data");
      }
      const data = await response.json();
      return {
        articles: data.articles || [],
        lectures: data.lectures || [],
        events: data.events || [],
        presentations: data.presentations || [],
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
