import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type {
  Notification,
  NotificationWithReadCount,
  NotificationsListResponse,
  UserNotificationsResponse,
  NotificationCreateInput,
  NotificationUpdateInput,
} from "@/types/Notifications/notifications";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: () => [...notificationKeys.lists()] as const,
  details: () => [...notificationKeys.all, "detail"] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  user: () => [...notificationKeys.all, "user"] as const,
  unreadCount: () => [...notificationKeys.all, "unreadCount"] as const,
};

// Admin: List all notifications
export function useNotifications() {
  return useQuery<NotificationsListResponse>({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Admin: Get single notification
export function useNotification(id: string | undefined) {
  return useQuery<Notification>({
    queryKey: notificationKeys.detail(id!),
    queryFn: async () => {
      const response = await fetch(`/api/notifications/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch notification");
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Admin: Create notification
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NotificationCreateInput) => {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create notification");
      }

      return response.json() as Promise<Notification>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Admin: Update notification
export function useUpdateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NotificationUpdateInput }) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update notification");
      }

      return response.json() as Promise<Notification>;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(id) });
    },
  });
}

// Admin: Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete notification");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// User: Get user's notifications
export function useUserNotifications() {
  const { data: session } = useSession();

  return useQuery<UserNotificationsResponse>({
    queryKey: notificationKeys.user(),
    queryFn: async () => {
      const response = await fetch("/api/notifications/user");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// User: Get unread count
export function useUnreadNotificationCount() {
  const { data: session } = useSession();

  return useQuery<{ unreadCount: number }>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await fetch("/api/notifications/unread-count");
      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }
      return response.json();
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 2, // 2 minutes for fresher count
    gcTime: 1000 * 60 * 30,
  });
}

// User: Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark notification as read");
      }

      return response.json();
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.user() });
      await queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount() });

      const previousNotifications = queryClient.getQueryData<UserNotificationsResponse>(
        notificationKeys.user()
      );

      const previousUnreadCount = queryClient.getQueryData<{ unreadCount: number }>(
        notificationKeys.unreadCount()
      );

      // Optimistically update notifications
      if (previousNotifications) {
        queryClient.setQueryData<UserNotificationsResponse>(notificationKeys.user(), {
          ...previousNotifications,
          notifications: previousNotifications.notifications.map((n) =>
            n.notificationId === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          ),
          unreadCount: Math.max(0, previousNotifications.unreadCount - 1),
        });
      }

      // Optimistically update unread count
      if (previousUnreadCount) {
        queryClient.setQueryData<{ unreadCount: number }>(notificationKeys.unreadCount(), {
          unreadCount: Math.max(0, previousUnreadCount.unreadCount - 1),
        });
      }

      return { previousNotifications, previousUnreadCount };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.user(), context.previousNotifications);
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.user() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}
