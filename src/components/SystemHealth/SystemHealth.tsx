"use client";

import React, { useState, useEffect } from "react";

interface HealthStatus {
  database: "healthy" | "warning" | "error";
  api: "healthy" | "warning" | "error";
  storage: "healthy" | "warning" | "error";
}

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus>({
    database: "healthy",
    api: "healthy",
    storage: "healthy",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Check database health by testing API endpoints
        const responses = await Promise.allSettled([
          fetch("/api/articles?limit=1"),
          fetch("/api/events"),
          fetch("/api/lectures"),
        ]);

        const databaseStatus = responses.every(
          (r) => r.status === "fulfilled" && r.value.ok
        )
          ? "healthy"
          : responses.some((r) => r.status === "rejected")
          ? "error"
          : "warning";

        // API health is based on our own status
        const apiStatus = "healthy";

        // Storage health (simulated - in real app would check file storage)
        const storageStatus = "healthy";

        setHealth({
          database: databaseStatus,
          api: apiStatus,
          storage: storageStatus,
        });
      } catch (error) {
        setHealth({
          database: "error",
          api: "error",
          storage: "warning",
        });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "❓";
    }
  };

  const healthItems = [
    { label: "מסד נתונים", key: "database" as keyof HealthStatus },
    { label: "API", key: "api" as keyof HealthStatus },
    { label: "אחסון", key: "storage" as keyof HealthStatus },
  ];

  if (loading) {
    return (
      <div className="p-6 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">מצב המערכת</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex items-center justify-between"
            >
              <div className="h-4 bg-cyan-300 rounded w-24"></div>
              <div className="h-6 bg-cyan-300 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">מצב המערכת</h3>
      <div className="space-y-3">
        {healthItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {item.label}
            </span>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                health[item.key]
              )}`}
            >
              <span>{getStatusIcon(health[item.key])}</span>
              <span className="capitalize">
                {health[item.key] === "healthy"
                  ? "תקין"
                  : health[item.key] === "warning"
                  ? "אזהרה"
                  : "שגיאה"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-cyan-200">
        <div className="text-xs text-gray-500 text-center">
          עודכן לאחרונה: {new Date().toLocaleTimeString("he-IL")}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
