import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryCache } from "@/constants/query-cache";
import type {
  Presentation,
  PresentationCategory,
} from "../types/Presentations/presentations";

export const presentationsKeys = {
  all: ["presentations"] as const,
  lists: () => [...presentationsKeys.all, "list"] as const,
  list: (params?: any) => [...presentationsKeys.lists(), params] as const,
  details: () => [...presentationsKeys.all, "detail"] as const,
  detail: (id: string) => [...presentationsKeys.details(), id] as const,
};

export function usePresentations() {
  return useQuery<PresentationCategory[], Error>({
    queryKey: presentationsKeys.lists(),
    queryFn: async () => {
      const response = await fetch("/api/presentations");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch presentations: ${response.statusText}`
        );
      }
      return response.json();
    },
    staleTime: queryCache.presentations.staleTime,
    gcTime: queryCache.presentations.gcTime,
  });
}

export function usePresentation(id: string | undefined) {
  return useQuery({
    queryKey: presentationsKeys.detail(id!),
    queryFn: async (): Promise<Presentation> => {
      if (!id) throw new Error("Presentation ID is required");

      const response = await fetch(`/api/presentations/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Presentation not found");
        }
        throw new Error(`Failed to fetch presentation: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: queryCache.presentation.staleTime,
    gcTime: queryCache.presentation.gcTime,
  });
}

export function useCreatePresentation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (presentationData: any): Promise<Presentation> => {
      const response = await fetch("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presentationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create presentation");
      }

      return response.json();
    },
    onSuccess: (newPresentation) => {
      queryClient.invalidateQueries({ queryKey: presentationsKeys.lists() });
      queryClient.setQueryData(
        presentationsKeys.detail(newPresentation.id),
        newPresentation
      );
    },
  });
}

export function useUpdatePresentation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updateData
    }: { id: string } & any): Promise<Presentation> => {
      const response = await fetch(`/api/presentations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update presentation");
      }

      return response.json();
    },
    onSuccess: (updatedPresentation) => {
      queryClient.setQueryData(
        presentationsKeys.detail(updatedPresentation.id),
        updatedPresentation
      );
      queryClient.invalidateQueries({ queryKey: presentationsKeys.lists() });
    },
  });
}

export function useDeletePresentation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (presentationId: string): Promise<void> => {
      const response = await fetch(`/api/presentations/${presentationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete presentation");
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({
        queryKey: presentationsKeys.detail(deletedId),
      });
      queryClient.invalidateQueries({ queryKey: presentationsKeys.lists() });
    },
  });
}
