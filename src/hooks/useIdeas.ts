import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryCache } from "@/constants/query-cache";

export interface IdeaNote {
  id: string;
  title: string;
  content: string | null;
  color: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaInput {
  title: string;
  content?: string;
  color?: string | null;
  pinned?: boolean;
}

export const ideasKeys = {
  all: ["ideas"] as const,
  lists: () => [...ideasKeys.all, "list"] as const,
};

export function useIdeas() {
  return useQuery<IdeaNote[], Error>({
    queryKey: ideasKeys.lists(),
    queryFn: async () => {
      const response = await fetch("/api/ideas");
      if (!response.ok) {
        throw new Error(`Failed to fetch ideas: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: queryCache.default.staleTime,
    gcTime: queryCache.default.gcTime,
  });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: IdeaInput): Promise<IdeaNote> => {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create idea");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideasKeys.all });
    },
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<IdeaInput>): Promise<IdeaNote> => {
      const response = await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update idea");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideasKeys.all });
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete idea");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideasKeys.all });
    },
  });
}
