"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  CalendarDays,
  Video,
  Presentation,
  TrendingUp,
  Minus,
} from "lucide-react";

interface StatItem {
  total: number;
  thisMonth: number;
}

interface Stats {
  articles: StatItem;
  events: StatItem;
  lectures: StatItem;
  presentations: StatItem;
}

const QuickStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white border border-gray-200 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 w-12 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        לא ניתן לטעון סטטיסטיקות
      </div>
    );
  }

  const statItems = [
    {
      label: "מאמרים",
      icon: FileText,
      total: stats.articles.total,
      thisMonth: stats.articles.thisMonth,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "אירועים",
      icon: CalendarDays,
      total: stats.events.total,
      thisMonth: stats.events.thisMonth,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "הרצאות",
      icon: Video,
      total: stats.lectures.total,
      thisMonth: stats.lectures.thisMonth,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "מצגות",
      icon: Presentation,
      total: stats.presentations.total,
      thisMonth: stats.presentations.thisMonth,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => {
        const IconComponent = item.icon;
        const hasChange = item.thisMonth > 0;

        return (
          <div
            key={index}
            className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Icon + Label */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center`}
              >
                <IconComponent className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {item.label}
              </span>
            </div>

            {/* Total Count */}
            <div className="text-3xl font-bold text-gray-900 mb-2 text-center">
              {item.total}
            </div>

            {/* Monthly Change Indicator */}
            <div className="flex items-center gap-1.5">
              {hasChange ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    +{item.thisMonth}
                  </span>
                  <span className="text-xs text-gray-500">החודש</span>
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">ללא שינוי</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickStats;
