"use client";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Check,
  Calendar,
} from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import {
  useUserNotifications,
  useMarkNotificationRead,
} from "@/hooks/useNotifications";

export default function NotificationsSection() {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";
  const { data, isLoading } = useUserNotifications();
  const markAsRead = useMarkNotificationRead();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleToggleExpand = (notificationId: string, isRead: boolean) => {
    if (expandedId === notificationId) {
      setExpandedId(null);
    } else {
      setExpandedId(notificationId);
      // Mark as read if not already
      if (!isRead) {
        markAsRead.mutate(notificationId);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("account.notifications.title")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("account.notifications.loading")}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("account.notifications.title")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {unreadCount > 0
              ? t("account.notifications.unreadCount").replace("{count}", String(unreadCount))
              : t("account.notifications.allRead")}
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-6">
          <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("account.notifications.noNotifications")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((userNotification) => {
            const isExpanded = expandedId === userNotification.notificationId;
            const notification = userNotification.notification;

            return (
              <div
                key={userNotification.id}
                className={`rounded-xl border transition-all ${
                  userNotification.isRead
                    ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                }`}
              >
                <button
                  onClick={() =>
                    handleToggleExpand(userNotification.notificationId, userNotification.isRead)
                  }
                  className="w-full p-3 flex items-start gap-3 text-start"
                >
                  {notification.imageUrl ? (
                    <img
                      src={notification.imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-medium truncate ${
                          userNotification.isRead
                            ? "text-gray-900 dark:text-white"
                            : "text-amber-900 dark:text-amber-100"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!userNotification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-0">
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {notification.message}
                      </p>
                      {userNotification.isRead && userNotification.readAt && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {t("account.notifications.readOn")} {formatDate(userNotification.readAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
