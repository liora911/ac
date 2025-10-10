import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import type {
  Article,
  ArticlesListResponse,
  ArticlesQueryParams,
  CreateArticleRequest,
  UpdateArticleRequest,
} from "../types/Articles/articles";

// Query keys
export const articlesKeys = {
  all: ["articles"] as const,
  lists: () => [...articlesKeys.all, "list"] as const,
  list: (params: ArticlesQueryParams) =>
    [...articlesKeys.lists(), params] as const,
  details: () => [...articlesKeys.all, "detail"] as const,
  detail: (id: string) => [...articlesKeys.details(), id] as const,
};

// Fetch articles with pagination and filtering
export function useArticles(params: ArticlesQueryParams = {}) {
  return useQuery({
    queryKey: articlesKeys.list(params),
    queryFn: async (): Promise<ArticlesListResponse> => {
      const searchParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });

      const response = await fetch(`/api/articles?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Fetch single article by ID
export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: articlesKeys.detail(id!),
    queryFn: async (): Promise<Article> => {
      if (!id) throw new Error("Article ID is required");

      const response = await fetch(`/api/articles/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Article not found");
        }
        throw new Error(`Failed to fetch article: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Create new article
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleData: CreateArticleRequest): Promise<Article> => {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create article");
      }

      return response.json();
    },
    onSuccess: (newArticle) => {
      // Invalidate and refetch articles list
      queryClient.invalidateQueries({ queryKey: articlesKeys.lists() });

      // Add the new article to the cache
      queryClient.setQueryData(articlesKeys.detail(newArticle.id), newArticle);
    },
  });
}

// Update existing article
export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updateData
    }: UpdateArticleRequest): Promise<Article> => {
      const response = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update article");
      }

      return response.json();
    },
    onSuccess: (updatedArticle) => {
      // Update the article in cache
      queryClient.setQueryData(
        articlesKeys.detail(updatedArticle.id),
        updatedArticle
      );

      // Invalidate articles list to refetch
      queryClient.invalidateQueries({ queryKey: articlesKeys.lists() });
    },
  });
}

// Delete article
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: string): Promise<void> => {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete article");
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: articlesKeys.detail(deletedId) });

      // Invalidate articles list
      queryClient.invalidateQueries({ queryKey: articlesKeys.lists() });
    },
  });
}

// Hook for paginated articles (alternative to infinite scrolling)
export function useArticlesPage(params: ArticlesQueryParams = {}) {
  return useArticles(params);
}

// Hook for article search
export function useSearchArticles(
  searchQuery: string,
  params: Omit<ArticlesQueryParams, "search"> = {}
) {
  return useQuery({
    queryKey: [...articlesKeys.lists(), "search", searchQuery, params],
    queryFn: async (): Promise<ArticlesListResponse> => {
      if (!searchQuery.trim()) {
        return { articles: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      }

      const searchParamsObj: Record<string, string> = {
        search: searchQuery,
        limit: String(params.limit || 20),
      };

      if (params.page) searchParamsObj.page = String(params.page);
      if (params.categoryId) searchParamsObj.categoryId = params.categoryId;
      if (params.tagId) searchParamsObj.tagId = params.tagId;
      if (params.status) searchParamsObj.status = params.status;
      if (params.featured) searchParamsObj.featured = String(params.featured);
      if (params.sortBy) searchParamsObj.sortBy = params.sortBy;
      if (params.sortOrder) searchParamsObj.sortOrder = params.sortOrder;

      const searchParams = new URLSearchParams(searchParamsObj);

      const response = await fetch(`/api/articles?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Failed to search articles: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!searchQuery.trim(),
    staleTime: 1000 * 60 * 2, // 2 minutes for search results
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook for featured articles
export function useFeaturedArticles(limit: number = 5) {
  return useArticles({
    featured: true,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
}

// Hook for articles by category
export function useArticlesByCategory(
  categoryId: string | undefined,
  params: Omit<ArticlesQueryParams, "categoryId"> = {}
) {
  return useQuery({
    queryKey: [...articlesKeys.lists(), "category", categoryId, params],
    queryFn: async (): Promise<ArticlesListResponse> => {
      if (!categoryId) {
        return { articles: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      }

      const searchParamsObj: Record<string, string> = {
        categoryId,
        limit: String(params.limit || 10),
      };

      if (params.page) searchParamsObj.page = String(params.page);
      if (params.tagId) searchParamsObj.tagId = params.tagId;
      if (params.status) searchParamsObj.status = params.status;
      if (params.search) searchParamsObj.search = params.search;
      if (params.featured) searchParamsObj.featured = String(params.featured);
      if (params.sortBy) searchParamsObj.sortBy = params.sortBy;
      if (params.sortOrder) searchParamsObj.sortOrder = params.sortOrder;

      const searchParams = new URLSearchParams(searchParamsObj);

      const response = await fetch(`/api/articles?${searchParams}`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch articles by category: ${response.statusText}`
        );
      }
      return response.json();
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
