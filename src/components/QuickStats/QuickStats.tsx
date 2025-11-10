"use client";

import React, { useState, useEffect } from "react";

interface Stats {
  articles: number;
  events: number;
  lectures: number;
  presentations: number;
}

const QuickStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    articles: 0,
    events: 0,
    lectures: 0,
    presentations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [articlesRes, eventsRes, lecturesRes, presentationsRes] =
          await Promise.all([
            fetch("/api/articles"),
            fetch("/api/events"),
            fetch("/api/lectures"),
            fetch("/api/presentations"),
          ]);

        const articlesData = articlesRes.ok ? await articlesRes.json() : null;
        const eventsData = eventsRes.ok ? await eventsRes.json() : null;
        const lecturesData = lecturesRes.ok ? await lecturesRes.json() : null;
        const presentationsData = presentationsRes.ok
          ? await presentationsRes.json()
          : null;

        // Extract counts correctly based on API response structure
        const articles = articlesData?.total || articlesData?.length || 0;
        const events = Array.isArray(eventsData) ? eventsData.length : 0;
        const lectures = Array.isArray(lecturesData)
          ? lecturesData.reduce(
              (total: number, cat: any) =>
                total +
                cat.lectures.length +
                cat.subcategories.reduce(
                  (subTotal: number, sub: any) =>
                    subTotal + sub.lectures.length,
                  0
                ),
              0
            )
          : 0;
        const presentations = Array.isArray(presentationsData)
          ? presentationsData.reduce(
              (total: number, cat: any) => total + cat.presentations.length,
              0
            )
          : 0;

        setStats({ articles, events, lectures, presentations });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 animate-pulse"
          >
            <div className="h-8 bg-purple-300 rounded mb-2"></div>
            <div className="h-4 bg-purple-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "מאמרים",
      value: stats.articles,
      icon: "📝",
      color: "from-blue-50 to-indigo-50",
    },
    {
      label: "אירועים",
      value: stats.events,
      icon: "📅",
      color: "from-green-50 to-emerald-50",
    },
    {
      label: "הרצאות",
      value: stats.lectures,
      icon: "🎓",
      color: "from-purple-50 to-pink-50",
    },
    {
      label: "מצגות",
      value: stats.presentations,
      icon: "📊",
      color: "from-orange-50 to-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg bg-gradient-to-br ${item.color} border border-opacity-50 shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">{item.icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {item.value}
              </div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
