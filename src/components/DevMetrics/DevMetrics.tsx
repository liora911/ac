"use client";

import React from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { PieChart, ExternalLink } from "lucide-react";

const STATCOUNTER_PROJECT = "13202600";
const STATCOUNTER_SECURITY = "ec5154da";

export default function DevMetrics() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <PieChart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("devMetrics.title") || "Analytics"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            StatCounter
          </p>
        </div>
      </div>

      {/* StatCounter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("devMetrics.liveStats") || "Live Statistics"}
          </h3>
          <a
            href={`https://statcounter.com/p${STATCOUNTER_PROJECT}/summary/?guest=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>{t("devMetrics.fullDashboard") || "Full Dashboard"}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* StatCounter Summary Stats Embeds */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            label={t("devMetrics.pageLoadsToday") || "Page Loads Today"}
            embedType="0"
          />
          <StatCard
            label={t("devMetrics.uniqueVisitorsToday") || "Unique Visitors Today"}
            embedType="1"
          />
          <StatCard
            label={t("devMetrics.firstTimeVisitors") || "First Time Visitors"}
            embedType="2"
          />
          <StatCard
            label={t("devMetrics.returningVisitors") || "Returning Visitors"}
            embedType="3"
          />
          <StatCard
            label={t("devMetrics.totalPageLoads") || "Total Page Loads"}
            embedType="4"
          />
          <StatCard
            label={t("devMetrics.totalUniqueVisitors") || "Total Unique Visitors"}
            embedType="5"
          />
        </div>

        {/* Quick Links to StatCounter Reports */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t("devMetrics.quickReports") || "Quick Reports"}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Summary", path: "summary" },
              { label: "Recent Visitors", path: "visitor" },
              { label: "Popular Pages", path: "popular" },
              { label: "Entry Pages", path: "entry" },
              { label: "Exit Pages", path: "exit" },
              { label: "Came From", path: "came_from" },
              { label: "Countries", path: "country" },
              { label: "Browsers", path: "browser" },
              { label: "OS", path: "os" },
              { label: "Screen Resolution", path: "resolution" },
            ].map((report) => (
              <a
                key={report.path}
                href={`https://statcounter.com/p${STATCOUNTER_PROJECT}/${report.path}/?guest=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {report.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, embedType }: { label: string; embedType: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <iframe
        src={`https://c.statcounter.com/${STATCOUNTER_PROJECT}/0/${STATCOUNTER_SECURITY}/${embedType}/`}
        className="border-0 w-full"
        style={{ height: "40px" }}
        title={label}
      />
    </div>
  );
}
