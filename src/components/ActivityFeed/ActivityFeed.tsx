"use client";

import React, { useState, useEffect } from "react";

interface ActivityItem {
  id: string;
  type: "article" | "event" | "lecture" | "presentation";
  title: string;
  action: "created" | "updated";
  timestamp: string;
  author: string;
}

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const [articlesRes, eventsRes, lecturesRes, presentationsRes] =
          await Promise.all([
            fetch("/api/articles?limit=5"),
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
              type: "event",
              title: event.title,
              action: "created",
              timestamp: event.createdAt,
              author: event.author?.name || "Unknown",
            });
          });
        }

        activities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setActivities(activities.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "article":
        return "📝";
      case "event":
        return "📅";
      case "lecture":
        return "🎓";
      case "presentation":
        return "📊";
      default:
        return "📄";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "לפני פחות משעה";
    if (diffInHours < 24) return `לפני ${diffInHours} שעות`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `לפני ${diffInDays} ימים`;
  };

  if (loading) {
    return (
      <div className="p-6 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          פעילות אחרונה
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-indigo-300 rounded mb-1"></div>
                  <div className="h-3 bg-indigo-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        פעילות אחרונה
      </h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            אין פעילות אחרונה
          </p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-md bg-white/50 hover:bg-white/70 transition-colors"
            >
              <div className="text-xl">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600">
                  {activity.action === "created" ? "נוצר" : "עודכן"} על ידי{" "}
                  {activity.author}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
