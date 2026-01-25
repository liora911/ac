export interface Notification {
  id: string;
  title: string;
  message: string;
  imageUrl?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationWithReadCount extends Notification {
  readCount: number;
  totalCount: number;
}

export interface UserNotification {
  id: string;
  userId: string;
  notificationId: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  notification: Notification;
}

export interface NotificationCreateInput {
  title: string;
  message: string;
  imageUrl?: string | null;
  published?: boolean;
}

export interface NotificationUpdateInput {
  title?: string;
  message?: string;
  imageUrl?: string | null;
  published?: boolean;
}

export interface NotificationsListResponse {
  notifications: NotificationWithReadCount[];
  total: number;
}

export interface UserNotificationsResponse {
  notifications: UserNotification[];
  unreadCount: number;
}
