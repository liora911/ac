import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryCache } from "@/constants/query-cache";
import type {
  Comment,
  CommentLiker,
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

// Toggle like on a comment
export function useToggleCommentLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, articleId }: { commentId: string; articleId: string }) => {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to toggle like");
      return response.json() as Promise<{ liked: boolean }>;
    },
    onMutate: async ({ commentId, articleId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: commentKeys.list(articleId) });
      const previous = queryClient.getQueryData<CommentsResponse>(commentKeys.list(articleId));

      if (previous) {
        queryClient.setQueryData<CommentsResponse>(commentKeys.list(articleId), {
          ...previous,
          comments: previous.comments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  isLikedByMe: !c.isLikedByMe,
                  likeCount: c.isLikedByMe ? c.likeCount - 1 : c.likeCount + 1,
                }
              : c
          ),
        });
      }

      return { previous };
    },
    onError: (_, { articleId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentKeys.list(articleId), context.previous);
      }
    },
    onSettled: (_, __, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(articleId) });
    },
  });
}

// Fetch likers for a comment
export function useCommentLikers(commentId: string | null) {
  return useQuery<CommentLiker[]>({
    queryKey: ["comment-likers", commentId],
    queryFn: async () => {
      const res = await fetch(`/api/comments/${commentId}/like`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.likers || [];
    },
    enabled: !!commentId,
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
