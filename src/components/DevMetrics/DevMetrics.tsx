"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/contexts/Translation/translation.context";
import {
  BarChart3,
  Activity,
  Users,
  Eye,
  Clock,
  Zap,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { RATING_COLORS, RATING_LABELS, WEB_VITAL_THRESHOLDS } from "@/constants/dev-metrics";
import type { RatingType } from "@/constants/dev-metrics";

interface WebVitalMetric {
  name: string;
  value: number;
  rating: RatingType;
  description: string;
}

interface AnalyticsData {
  pageViews: {
    total: number;
    change: number;
  };
  visitors: {
    total: number;
    unique: number;
    change: number;
  };
  topPages: Array<{
    path: string;
    views: number;
    percentage: number;
  }>;
  webVitals: WebVitalMetric[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  period: string;
}

export default function DevMetrics() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("7d");

  const { data, isLoading, error, refetch, isFetching } = useQuery<AnalyticsData>({
    queryKey: ["devMetrics", period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch analytics");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  const getRating = (name: string, value: number): "good" | "needs-improvement" | "poor" => {
    const thresholds = WEB_VITAL_THRESHOLDS[name as keyof typeof WEB_VITAL_THRESHOLDS];
    if (!thresholds) return "good";
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.poor) return "needs-improvement";
    return "poor";
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("devMetrics.setupRequired") || "Analytics Setup Required"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
              {t("devMetrics.setupDescription") || "To view developer metrics, you need to configure your Vercel Analytics API token in the environment variables."}
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-left w-full max-w-lg">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2">
                # Add to .env.local:
              </p>
              <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                VERCEL_ANALYTICS_TOKEN=your_token_here
              </code>
            </div>
            <a
              href="https://vercel.com/docs/analytics/api"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>{t("devMetrics.learnMore") || "Learn how to get your token"}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Show simulated data for demo */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("devMetrics.previewMode") || "Preview Mode - Sample Data"}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t("devMetrics.previewDescription") || "Below is a preview of what your metrics dashboard will look like once configured."}
          </p>
          <DemoMetrics />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("devMetrics.title") || "Developer Metrics"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("devMetrics.subtitle") || "Web Vitals & Traffic Analytics"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {(["24h", "7d", "30d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {p === "24h" ? "24h" : p === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <MetricsSkeleton />
      ) : data ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Eye}
              label={t("devMetrics.pageViews") || "Page Views"}
              value={formatNumber(data.pageViews.total)}
              change={data.pageViews.change}
              color="blue"
            />
            <MetricCard
              icon={Users}
              label={t("devMetrics.visitors") || "Visitors"}
              value={formatNumber(data.visitors.total)}
              subValue={`${formatNumber(data.visitors.unique)} unique`}
              change={data.visitors.change}
              color="green"
            />
            <MetricCard
              icon={Smartphone}
              label={t("devMetrics.mobileTraffic") || "Mobile Traffic"}
              value={`${data.deviceBreakdown.mobile}%`}
              subValue={`Desktop: ${data.deviceBreakdown.desktop}%`}
              color="purple"
            />
            <MetricCard
              icon={Activity}
              label={t("devMetrics.avgLCP") || "Avg. LCP"}
              value={`${data.webVitals.find(v => v.name === "LCP")?.value || 0}ms`}
              rating={getRating("LCP", data.webVitals.find(v => v.name === "LCP")?.value || 0)}
              color="amber"
            />
          </div>

          {/* Web Vitals Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("devMetrics.coreWebVitals") || "Core Web Vitals"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.webVitals.map((vital) => (
                <WebVitalCard key={vital.name} vital={vital} />
              ))}
            </div>
          </div>

          {/* Top Pages & Device Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("devMetrics.topPages") || "Top Pages"}
                </h3>
              </div>

              <div className="space-y-3">
                {data.topPages.map((page, idx) => (
                  <div key={page.path} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {page.path}
                      </p>
                      <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${page.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(page.views)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("devMetrics.deviceBreakdown") || "Device Breakdown"}
                </h3>
              </div>

              <div className="space-y-4">
                <DeviceBar label="Desktop" value={data.deviceBreakdown.desktop} icon={Monitor} color="blue" />
                <DeviceBar label="Mobile" value={data.deviceBreakdown.mobile} icon={Smartphone} color="green" />
                <DeviceBar label="Tablet" value={data.deviceBreakdown.tablet} icon={Smartphone} color="purple" />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// Sub-components

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  change,
  rating,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  change?: number;
  rating?: "good" | "needs-improvement" | "poor";
  color: "blue" | "green" | "purple" | "amber";
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <span className={`text-sm font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {rating && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RATING_COLORS[rating]}`}>
            {RATING_LABELS[rating]}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subValue && <p className="text-sm text-gray-500 dark:text-gray-400">{subValue}</p>}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

function WebVitalCard({ vital }: { vital: WebVitalMetric }) {
  const thresholds = WEB_VITAL_THRESHOLDS[vital.name as keyof typeof WEB_VITAL_THRESHOLDS];
  const unit = thresholds?.unit || "";

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{vital.name}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RATING_COLORS[vital.rating]}`}>
          {RATING_LABELS[vital.rating]}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {vital.value}{unit}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {vital.description}
      </p>
      {thresholds && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="text-green-600">Good: ≤{thresholds.good}{unit}</span>
          <span>•</span>
          <span className="text-red-600">Poor: &gt;{thresholds.poor}{unit}</span>
        </div>
      )}
    </div>
  );
}

function DeviceBar({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: "blue" | "green" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="mt-3 space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoMetrics() {
  const demoData = {
    pageViews: { total: 12847, change: 12.5 },
    visitors: { total: 3241, unique: 2156, change: 8.3 },
    deviceBreakdown: { desktop: 58, mobile: 38, tablet: 4 },
    webVitals: [
      { name: "LCP", value: 2100, rating: "good" as const, description: "Largest Contentful Paint" },
      { name: "FID", value: 85, rating: "good" as const, description: "First Input Delay" },
      { name: "CLS", value: 0.08, rating: "good" as const, description: "Cumulative Layout Shift" },
      { name: "TTFB", value: 650, rating: "good" as const, description: "Time to First Byte" },
      { name: "INP", value: 180, rating: "good" as const, description: "Interaction to Next Paint" },
    ],
    topPages: [
      { path: "/", views: 4521, percentage: 100 },
      { path: "/articles", views: 2834, percentage: 63 },
      { path: "/lectures", views: 1923, percentage: 43 },
      { path: "/presentations", views: 1456, percentage: 32 },
      { path: "/events", views: 987, percentage: 22 },
    ],
  };

  return (
    <div className="opacity-75 pointer-events-none">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-lg font-bold text-gray-900 dark:text-white">12.8K</p>
          <p className="text-xs text-gray-500">Page Views</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-lg font-bold text-gray-900 dark:text-white">3.2K</p>
          <p className="text-xs text-gray-500">Visitors</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-lg font-bold text-green-600">2.1s</p>
          <p className="text-xs text-gray-500">LCP (Good)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-lg font-bold text-gray-900 dark:text-white">38%</p>
          <p className="text-xs text-gray-500">Mobile</p>
        </div>
      </div>
    </div>
  );
}
