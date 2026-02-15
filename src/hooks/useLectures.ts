import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryCache } from "@/constants/query-cache";
import type { Lecture, Category } from "../types/Lectures/lectures";

interface CreateLectureInput {
  title: string;
  description?: string;
  videoUrl?: string;
  duration: string;
  date?: string;
  bannerImageUrl?: string;
  categoryId: string;
  isPremium?: boolean;
}

export const lecturesKeys = {
  all: ["lectures"] as const,
  lists: () => [...lecturesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...lecturesKeys.lists(), params] as const,
  details: () => [...lecturesKeys.all, "detail"] as const,
  detail: (id: string) => [...lecturesKeys.details(), id] as const,
};

export function useLectures() {
  return useQuery<Category[], Error>({
    queryKey: lecturesKeys.lists(),
    queryFn: async () => {
      const response = await fetch("/api/lectures");
      if (!response.ok) {
        throw new Error(`Failed to fetch lectures: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: queryCache.lectures.staleTime,
    gcTime: queryCache.lectures.gcTime,
  });
}

export function useLecture(id: string | undefined) {
  return useQuery({
    queryKey: lecturesKeys.detail(id!),
    queryFn: async (): Promise<Lecture> => {
      if (!id) throw new Error("Lecture ID is required");

      const response = await fetch(`/api/lectures/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Lecture not found");
        }
        throw new Error(`Failed to fetch lecture: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: queryCache.lecture.staleTime,
    gcTime: queryCache.lecture.gcTime,
  });
}

export function useCreateLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lectureData: CreateLectureInput): Promise<Lecture> => {
      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lectureData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create lecture");
      }

      return response.json();
    },
    onSuccess: (newLecture) => {
      queryClient.invalidateQueries({ queryKey: lecturesKeys.lists() });
      queryClient.setQueryData(lecturesKeys.detail(newLecture.id), newLecture);
    },
  });
}

export function useUpdateLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updateData
    }: { id: string } & Partial<CreateLectureInput>): Promise<Lecture> => {
      const response = await fetch(`/api/lectures/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update lecture");
      }

      return response.json();
    },
    onSuccess: (updatedLecture) => {
      queryClient.setQueryData(
        lecturesKeys.detail(updatedLecture.id),
        updatedLecture
      );
      queryClient.invalidateQueries({ queryKey: lecturesKeys.lists() });
    },
  });
}

export function useDeleteLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lectureId: string): Promise<void> => {
      const response = await fetch(`/api/lectures/${lectureId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete lecture");
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: lecturesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: lecturesKeys.lists() });
    },
  });
}
