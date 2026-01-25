"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CalendarDays,
  Video,
  Presentation,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Filter,
  X,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import type { ActivityItem } from "@/types/Activity/activity";

const ActivityFeed: React.FC = () => {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<"bottom" | "top">("bottom");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ActivityItem | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Date range filtering
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setLoading(true);
        const [articlesRes, eventsRes, lecturesRes, presentationsRes] =
          await Promise.all([
            fetch("/api/articles?limit=20"),
            fetch("/api/events"),
            fetch("/api/lectures"),
            fetch("/api/presentations"),
          ]);

        const activities: ActivityItem[] = [];

        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          const recentArticles = articlesData.articles.slice(0, 3);
          recentArticles.forEach((article: any) => {
            activities.push({
              id: `article-${article.id}`,
              rawId: article.id, // Use ID for editing, slug is only for viewing
              slug: article.slug, // Store slug separately for view URLs
              type: "article",
              title: article.title,
              action: "created",
              timestamp: article.createdAt,
              author: article.author?.name || "Unknown",
            });
          });
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const recentEvents = eventsData.slice(0, 2);
          recentEvents.forEach((event: any) => {
            activities.push({
              id: `event-${event.id}`,
              rawId: event.id,
              type: "event",
              title: event.title,
              action: "created",
              timestamp: event.createdAt,
              author: event.author?.name || "Unknown",
            });
          });
        }

        if (lecturesRes.ok) {
          const lecturesData = await lecturesRes.json();

          const flattenLectures = (categories: any[]): any[] => {
            const result: any[] = [];

            const traverse = (cats: any[]) => {
              cats.forEach((cat) => {
                if (cat.lectures && Array.isArray(cat.lectures)) {
                  result.push(...cat.lectures);
                }
                if (cat.subcategories && Array.isArray(cat.subcategories)) {
                  traverse(cat.subcategories);
                }
              });
            };

            traverse(categories);
            return result;
          };

          const allLectures = flattenLectures(lecturesData).slice(0, 3);

          allLectures.forEach((lecture: any) => {
            activities.push({
              id: `lecture-${lecture.id}`,
              rawId: lecture.id,
              type: "lecture",
              title: lecture.title,
              action: "created",
              timestamp: lecture.date || lecture.createdAt,
              author: lecture.author?.name || "Unknown",
            });
          });
        }

        if (presentationsRes.ok) {
          const presentationsData = await presentationsRes.json();

          const flattenPresentations = (categories: any[]): any[] => {
            const result: any[] = [];

            const traverse = (cats: any[]) => {
              cats.forEach((cat) => {
                if (cat.presentations && Array.isArray(cat.presentations)) {
                  result.push(...cat.presentations);
                }
                if (cat.subcategories && Array.isArray(cat.subcategories)) {
                  traverse(cat.subcategories);
                }
              });
            };

            traverse(categories);
            return result;
          };

          const allPresentations = flattenPresentations(
            presentationsData
          ).slice(0, 3);

          allPresentations.forEach((presentation: any) => {
            activities.push({
              id: `presentation-${presentation.id}`,
              rawId: presentation.id,
              type: "presentation",
              title: presentation.title,
              action: "created",
              timestamp: presentation.createdAt,
              author: presentation.author?.name || "Unknown",
            });
          });
        }

        // Sort by timestamp (newest first)
        activities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Apply date range filter if specified
        let filteredActivities = activities;
        if (startDate || endDate) {
          filteredActivities = activities.filter((activity) => {
            const activityDate = new Date(activity.timestamp);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            // Set end date to end of day (23:59:59)
            if (end) {
              end.setHours(23, 59, 59, 999);
            }

            if (start && activityDate < start) return false;
            if (end && activityDate > end) return false;
            return true;
          });
        }

        setActivities(filteredActivities.slice(0, limit));
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, [startDate, endDate, limit]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "article":
        return { icon: FileText, bg: "bg-blue-100", color: "text-blue-600" };
      case "event":
        return { icon: CalendarDays, bg: "bg-green-100", color: "text-green-600" };
      case "lecture":
        return { icon: Video, bg: "bg-purple-100", color: "text-purple-600" };
      case "presentation":
        return { icon: Presentation, bg: "bg-orange-100", color: "text-orange-600" };
      default:
        return { icon: FileText, bg: "bg-gray-100", color: "text-gray-600" };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "article":
        return t("activity.typeArticle");
      case "event":
        return t("activity.typeEvent");
      case "lecture":
        return t("activity.typeLecture");
      case "presentation":
        return t("activity.typePresentation");
      default:
        return "";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return t("activity.lessThanHourAgo");
    if (diffInHours < 24) return t("activity.hoursAgo").replace("{count}", String(diffInHours));
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return t("activity.yesterday");
    if (diffInDays < 7) return t("activity.daysAgo").replace("{count}", String(diffInDays));
    if (diffInDays < 30) return t("activity.weeksAgo").replace("{count}", String(Math.floor(diffInDays / 7)));
    return t("activity.monthsAgo").replace("{count}", String(Math.floor(diffInDays / 30)));
  };

  const handleView = (activity: ActivityItem) => {
    setOpenMenuId(null);
    switch (activity.type) {
      case "article":
        // Use slug for SEO-friendly URL, fallback to ID
        router.push(`/articles/${activity.slug || activity.rawId}`);
        break;
      case "event":
        router.push(`/events`);
        break;
      case "lecture":
        router.push(`/lectures/${activity.rawId}`);
        break;
      case "presentation":
        router.push(`/presentations/${activity.rawId}`);
        break;
    }
  };

  const handleEdit = (activity: ActivityItem) => {
    setOpenMenuId(null);
    switch (activity.type) {
      case "article":
        router.push(`/edit-article/${activity.rawId}`);
        break;
      case "event":
        router.push(`/edit-event/${activity.rawId}`);
        break;
      case "lecture":
        router.push(`/edit-lecture/${activity.rawId}`);
        break;
      case "presentation":
        router.push(`/edit-presentation/${activity.rawId}`);
        break;
    }
  };

  const openDeleteModal = (activity: ActivityItem) => {
    setActivityToDelete(activity);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setActivityToDelete(null);
  };

  const confirmDelete = async () => {
    if (!activityToDelete) return;

    setDeleting(activityToDelete.id);

    try {
      const endpoint = `/${activityToDelete.type}s/${activityToDelete.rawId}`;
      const response = await fetch(`/api${endpoint}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setActivities((prev) => prev.filter((a) => a.id !== activityToDelete.id));
        showSuccess(t("activity.deleteSuccess").replace("{type}", getTypeLabel(activityToDelete.type)).replace("{title}", activityToDelete.title));
        closeDeleteModal();
      } else {
        showError(t("activity.deleteError"));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      showError(t("activity.deleteError"));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 animate-pulse"
          >
            <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setLimit(10);
  };

  const hasActiveFilters = startDate || endDate || limit !== 10;

  if (activities.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filter Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>{t("activity.filters")}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("activity.startDate")}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("activity.endDate")}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("activity.itemsToShow")}
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>{t("activity.clearFilters")}</span>
              </button>
            )}
          </div>
        )}

        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t("activity.noActivity")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>{t("activity.filters")}</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          )}
        </button>
        {hasActiveFilters && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t("activity.showing")} {activities.length} {t("activity.items")}
          </span>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("activity.startDate")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("activity.endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("activity.itemsToShow")}
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>{t("activity.clearFilters")}</span>
            </button>
          )}
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-1" ref={menuRef}>
      {activities.map((activity) => {
        const { icon: IconComponent, bg, color } = getActivityIcon(activity.type);
        const isMenuOpen = openMenuId === activity.id;
        const isActivityDeleting = deleting === activity.id;

        return (
          <div
            key={activity.id}
            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group ${
              isActivityDeleting ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {/* Icon */}
            <div
              className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
            >
              <IconComponent className={`w-4 h-4 ${color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activity.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`px-1.5 py-0.5 rounded ${bg} ${color} font-medium`}>
                  {getTypeLabel(activity.type)}
                </span>
                <span>•</span>
                <span>{formatTimeAgo(activity.timestamp)}</span>
              </div>
            </div>

            {/* Kebab Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  if (isMenuOpen) {
                    setOpenMenuId(null);
                  } else {
                    const button = e.currentTarget;
                    const rect = button.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - rect.bottom;
                    setMenuPosition(spaceBelow < 150 ? "top" : "bottom");
                    setOpenMenuId(activity.id);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={t("activity.actions")}
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>

              {isMenuOpen && (
                <div
                  className={`absolute left-0 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 ${
                    menuPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
                  }`}
                >
                  <button
                    onClick={() => handleView(activity)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{t("activity.view")}</span>
                  </button>
                  <button
                    onClick={() => handleEdit(activity)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>{t("activity.edit")}</span>
                  </button>
                  <button
                    onClick={() => openDeleteModal(activity)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t("activity.delete")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title={t("activity.deleteItem")}
        hideFooter
      >
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("activity.deleteConfirm")}
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            {t("activity.deleteWarning")} {activityToDelete ? getTypeLabel(activityToDelete.type) : ""}
            <span className="font-medium text-gray-900"> &quot;{activityToDelete?.title}&quot;</span>.
            <br />
            {t("activity.deleteIrreversible")}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={!!deleting}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              {t("admin.common.cancel")}
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={!!deleting}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("activity.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t("activity.delete")}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActivityFeed;
