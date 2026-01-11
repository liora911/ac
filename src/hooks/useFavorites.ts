import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export type FavoriteType = "ARTICLE" | "LECTURE" | "PRESENTATION";

interface FavoriteIds {
  articles: string[];
  lectures: string[];
  presentations: string[];
}

interface FavoritesFull {
  articles: Array<{
    id: string;
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

export const favoritesKeys = {
  all: ["favorites"] as const,
  ids: () => [...favoritesKeys.all, "ids"] as const,
  full: () => [...favoritesKeys.all, "full"] as const,
};

// Hook to get favorite IDs (lightweight, for checking if item is favorited)
export function useFavoriteIds() {
  const { data: session } = useSession();

  return useQuery<FavoriteIds>({
    queryKey: favoritesKeys.ids(),
    queryFn: async () => {
      const response = await fetch("/api/favorites");
      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }
      return response.json();
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook to get full favorites with item data (for favorites page)
export function useFavoritesFull() {
  const { data: session } = useSession();

  return useQuery<FavoritesFull>({
    queryKey: favoritesKeys.full(),
    queryFn: async () => {
      const response = await fetch("/api/favorites/full");
      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }
      return response.json();
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Hook to add a favorite
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
    }: {
      itemId: string;
      itemType: FavoriteType;
    }) => {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, itemType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add favorite");
      }

      return response.json();
    },
    onMutate: async ({ itemId, itemType }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: favoritesKeys.ids() });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<FavoriteIds>(
        favoritesKeys.ids()
      );

      // Optimistically update
      if (previousFavorites) {
        const key =
          itemType === "ARTICLE"
            ? "articles"
            : itemType === "LECTURE"
            ? "lectures"
            : "presentations";

        queryClient.setQueryData<FavoriteIds>(favoritesKeys.ids(), {
          ...previousFavorites,
          [key]: [...previousFavorites[key], itemId],
        });
      }

      return { previousFavorites };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoritesKeys.ids(), context.previousFavorites);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: favoritesKeys.all });
    },
  });
}

// Hook to remove a favorite
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
    }: {
      itemId: string;
      itemType: FavoriteType;
    }) => {
      const response = await fetch(
        `/api/favorites?itemId=${itemId}&itemType=${itemType}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove favorite");
      }

      return response.json();
    },
    onMutate: async ({ itemId, itemType }) => {
      await queryClient.cancelQueries({ queryKey: favoritesKeys.ids() });

      const previousFavorites = queryClient.getQueryData<FavoriteIds>(
        favoritesKeys.ids()
      );

      if (previousFavorites) {
        const key =
          itemType === "ARTICLE"
            ? "articles"
            : itemType === "LECTURE"
            ? "lectures"
            : "presentations";

        queryClient.setQueryData<FavoriteIds>(favoritesKeys.ids(), {
          ...previousFavorites,
          [key]: previousFavorites[key].filter((id) => id !== itemId),
        });
      }

      return { previousFavorites };
    },
    onError: (err, variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoritesKeys.ids(), context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoritesKeys.all });
    },
  });
}

// Helper hook to check if an item is favorited and toggle it
export function useFavorite(itemId: string, itemType: FavoriteType) {
  const { data: session } = useSession();
  const { data: favorites } = useFavoriteIds();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const key =
    itemType === "ARTICLE"
      ? "articles"
      : itemType === "LECTURE"
      ? "lectures"
      : "presentations";

  const isFavorited = favorites?.[key]?.includes(itemId) ?? false;
  const isLoading = addFavorite.isPending || removeFavorite.isPending;

  const toggle = () => {
    if (!session?.user) return;

    if (isFavorited) {
      removeFavorite.mutate({ itemId, itemType });
    } else {
      addFavorite.mutate({ itemId, itemType });
    }
  };

  return {
    isFavorited,
    isLoading,
    toggle,
    isLoggedIn: !!session?.user,
  };
}
