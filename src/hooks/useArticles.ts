import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArticleProps } from "@/types/Articles/articles";

const fetchArticles = async (): Promise<ArticleProps[]> => {
  const response = await fetch("/api/articles");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const createArticle = async (articleData: any): Promise<ArticleProps> => {
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
};

const deleteArticle = async (articleId: string): Promise<void> => {
  const response = await fetch(`/api/articles/${articleId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete article");
  }
};

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: fetchArticles,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createArticle,
    onSuccess: (newArticle) => {
      queryClient.setQueryData(
        ["articles"],
        (oldData: ArticleProps[] | undefined) => {
          return oldData ? [newArticle, ...oldData] : [newArticle];
        }
      );
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(
        ["articles"],
        (oldData: ArticleProps[] | undefined) => {
          return oldData?.filter((article) => article.id !== deletedId) || [];
        }
      );
    },
  });
}
