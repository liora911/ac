import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryCache } from "@/constants/query-cache";
import type {
  Comment,
  CommentsResponse,
  CreateCommentRequest,
} from "@/types/Comments/comments";

export const commentKeys = {
  all: ["comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  list: (articleId: string) => [...commentKeys.lists(), articleId] as const,
};

// Get comments for an article
export function useComments(articleId: string) {
  return useQuery<CommentsResponse>({
    queryKey: commentKeys.list(articleId),
    queryFn: async () => {
      const response = await fetch(`/api/articles/${articleId}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    },
    staleTime: queryCache.comments.staleTime,
    gcTime: queryCache.comments.gcTime,
  });
}

// Create a new comment
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommentRequest) => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create comment");
      }

      return response.json() as Promise<Comment>;
    },
    onSuccess: (_, variables) => {
      // Invalidate the comments list for this article
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.articleId),
      });
    },
  });
}

// Delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, articleId }: { id: string; articleId: string }) => {
      const response = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete comment");
      }

      return { id, articleId };
    },
    onSuccess: (data) => {
      // Invalidate the comments list for this article
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(data.articleId),
      });
    },
  });
}
