import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryCache } from "@/constants/query-cache";
import type {
  Archive,
  CreateArchiveRequest,
  UpdateArchiveRequest,
} from "@/types/Archive/archive";

export const archiveKeys = {
  all: ["archive"] as const,
  lists: () => [...archiveKeys.all, "list"] as const,
  list: () => [...archiveKeys.lists()] as const,
  details: () => [...archiveKeys.all, "detail"] as const,
  detail: (id: string) => [...archiveKeys.details(), id] as const,
};

// List all archive items (admin only)
export function useArchive() {
  return useQuery<Archive[]>({
    queryKey: archiveKeys.list(),
    queryFn: async () => {
      const response = await fetch("/api/archive");
      if (!response.ok) {
        throw new Error("Failed to fetch archives");
      }
      return response.json();
    },
    staleTime: queryCache.archive.staleTime,
    gcTime: queryCache.archive.gcTime,
  });
}

// Get single archive item (admin only)
export function useArchiveItem(id: string | undefined) {
  return useQuery<Archive>({
    queryKey: archiveKeys.detail(id!),
    queryFn: async () => {
      const response = await fetch(`/api/archive/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch archive");
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: queryCache.archive.staleTime,
    gcTime: queryCache.archive.gcTime,
  });
}

// Create archive item (admin only)
export function useCreateArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateArchiveRequest) => {
      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create archive");
      }

      return response.json() as Promise<Archive>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
    },
  });
}

// Update archive item (admin only)
export function useUpdateArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateArchiveRequest }) => {
      const response = await fetch(`/api/archive/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update archive");
      }

      return response.json() as Promise<Archive>;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
      queryClient.invalidateQueries({ queryKey: archiveKeys.detail(id) });
    },
  });
}

// Delete archive item (admin only)
export function useDeleteArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/archive/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete archive");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
    },
  });
}
