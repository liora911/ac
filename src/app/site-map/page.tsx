"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/Translation/translation.context";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  Presentation,
  CalendarDays,
  FolderTree,
  Home,
  Mail,
  CreditCard,
  Search,
  Heart,
  User,
  MapPin,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface CategoryNode {
  id: string;
  name: string;
  children: CategoryNode[];
  articleCount: number;
  lectureCount: number;
  presentationCount: number;
}

interface SitemapData {
  categories: CategoryNode[];
  uncategorizedCounts: {
    articles: number;
    lectures: number;
    presentations: number;
  };
  upcomingEventsCount: number;
  stats: {
    totalArticles: number;
    totalLectures: number;
    totalPresentations: number;
    totalEvents: number;
    totalCategories: number;
  };
}

function TreeNode({
  label,
  icon: Icon,
  href,
  children,
  defaultExpanded = false,
  count,
  level = 0,
  external = false,
}: {
  label: string;
  icon?: React.ElementType;
  href?: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  count?: number;
  level?: number;
  external?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = !!children;

  const content = (
    <div
      className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors ${
        href
          ? "hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
          : hasChildren
          ? "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          : ""
      }`}
      onClick={() => hasChildren && !href && setExpanded(!expanded)}
    >
      {hasChildren && !href && (
        <button
          className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
      )}
      {!hasChildren && !href && <span className="w-5" />}
      {Icon && (
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${
            href ? "text-blue-500" : "text-gray-500 dark:text-gray-400"
          }`}
        />
      )}
      <span
        className={`text-sm ${
          href
            ? "text-blue-600 dark:text-blue-400 hover:underline"
            : "text-gray-700 dark:text-gray-300 font-medium"
        }`}
      >
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          ({count})
        </span>
      )}
      {external && href && (
        <ExternalLink className="w-3 h-3 text-gray-400" />
      )}
    </div>
  );

  return (
    <div style={{ marginInlineStart: level > 0 ? "1rem" : 0 }}>
      {href ? <Link href={href}>{content}</Link> : content}
      {hasChildren && expanded && (
        <div className="border-s border-gray-200 dark:border-gray-700 ms-3">
          {children}
        </div>
      )}
    </div>
  );
}

function CategoryTree({ category, level = 0 }: { category: CategoryNode; level?: number }) {
  const { t } = useTranslation();
  const totalItems =
    category.articleCount + category.lectureCount + category.presentationCount;

  const hasContent = totalItems > 0 || category.children.length > 0;
  if (!hasContent) return null;

  return (
    <TreeNode
      label={category.name}
      icon={FolderTree}
      defaultExpanded={level === 0}
      count={totalItems}
      level={level}
    >
      {/* Subcategories first */}
      {category.children.map((child) => (
        <CategoryTree key={child.id} category={child} level={level + 1} />
      ))}

      {/* Content type links */}
      {category.articleCount > 0 && (
        <TreeNode
          label={t("sitemap.articles")}
          icon={FileText}
          href={`/articles?category=${category.id}`}
          count={category.articleCount}
          level={level + 1}
        />
      )}
      {category.lectureCount > 0 && (
        <TreeNode
          label={t("sitemap.lectures")}
          icon={Video}
          href={`/lectures?category=${category.id}`}
          count={category.lectureCount}
          level={level + 1}
        />
      )}
      {category.presentationCount > 0 && (
        <TreeNode
          label={t("sitemap.presentations")}
          icon={Presentation}
          href={`/presentations?category=${category.id}`}
          count={category.presentationCount}
          level={level + 1}
        />
      )}
    </TreeNode>
  );
}

export default function SitemapPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<SitemapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/sitemap-data");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch {
        setError("Failed to load sitemap data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error || "Error loading data"}</p>
      </div>
    );
  }

  const hasUncategorized =
    data.uncategorizedCounts.articles > 0 ||
    data.uncategorizedCounts.lectures > 0 ||
    data.uncategorizedCounts.presentations > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("sitemap.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("sitemap.description")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <Link
            href="/articles"
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <FileText className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.totalArticles}
            </p>
            <p className="text-xs text-gray-500">{t("sitemap.articles")}</p>
          </Link>
          <Link
            href="/lectures"
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
          >
            <Video className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.totalLectures}
            </p>
            <p className="text-xs text-gray-500">{t("sitemap.lectures")}</p>
          </Link>
          <Link
            href="/presentations"
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
          >
            <Presentation className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.totalPresentations}
            </p>
            <p className="text-xs text-gray-500">{t("sitemap.presentations")}</p>
          </Link>
          <Link
            href="/events"
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center hover:border-green-300 dark:hover:border-green-700 transition-colors"
          >
            <CalendarDays className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.totalEvents}
            </p>
            <p className="text-xs text-gray-500">{t("sitemap.events")}</p>
          </Link>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
            <FolderTree className="w-5 h-5 mx-auto mb-1 text-gray-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.totalCategories}
            </p>
            <p className="text-xs text-gray-500">{t("sitemap.categories")}</p>
          </div>
        </div>

        {/* Main Tree */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          {/* Main Pages */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              {t("sitemap.mainPages")}
            </h2>
            <div className="space-y-1">
              <TreeNode label={t("sitemap.home")} icon={Home} href="/" />
              <TreeNode
                label={t("sitemap.articles")}
                icon={FileText}
                href="/articles"
                count={data.stats.totalArticles}
              />
              <TreeNode
                label={t("sitemap.lectures")}
                icon={Video}
                href="/lectures"
                count={data.stats.totalLectures}
              />
              <TreeNode
                label={t("sitemap.presentations")}
                icon={Presentation}
                href="/presentations"
                count={data.stats.totalPresentations}
              />
              <TreeNode
                label={t("sitemap.events")}
                icon={CalendarDays}
                href="/events"
                count={data.stats.totalEvents}
              />
              <TreeNode label={t("sitemap.search")} icon={Search} href="/search" />
              <TreeNode label={t("sitemap.contact")} icon={Mail} href="/contact" />
              <TreeNode label={t("sitemap.pricing")} icon={CreditCard} href="/pricing" />
              <TreeNode label={t("sitemap.favorites")} icon={Heart} href="/favorites" />
              <TreeNode label={t("sitemap.account")} icon={User} href="/account" />
            </div>
          </div>

          {/* Content by Category */}
          {data.categories.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-gray-500" />
                {t("sitemap.contentByCategory")}
              </h2>
              <div className="space-y-1">
                {data.categories.map((category) => (
                  <CategoryTree key={category.id} category={category} />
                ))}

                {/* Uncategorized */}
                {hasUncategorized && (
                  <TreeNode
                    label={t("sitemap.uncategorized")}
                    icon={FolderTree}
                    count={
                      data.uncategorizedCounts.articles +
                      data.uncategorizedCounts.lectures +
                      data.uncategorizedCounts.presentations
                    }
                  >
                    {data.uncategorizedCounts.articles > 0 && (
                      <TreeNode
                        label={t("sitemap.articles")}
                        icon={FileText}
                        href="/articles"
                        count={data.uncategorizedCounts.articles}
                        level={1}
                      />
                    )}
                    {data.uncategorizedCounts.lectures > 0 && (
                      <TreeNode
                        label={t("sitemap.lectures")}
                        icon={Video}
                        href="/lectures"
                        count={data.uncategorizedCounts.lectures}
                        level={1}
                      />
                    )}
                    {data.uncategorizedCounts.presentations > 0 && (
                      <TreeNode
                        label={t("sitemap.presentations")}
                        icon={Presentation}
                        href="/presentations"
                        count={data.uncategorizedCounts.presentations}
                        level={1}
                      />
                    )}
                  </TreeNode>
                )}
              </div>
            </div>
          )}

          {/* Events Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gray-500" />
              {t("sitemap.events")}
            </h2>
            <div className="space-y-1">
              {data.upcomingEventsCount > 0 ? (
                <TreeNode
                  label={t("sitemap.upcomingEvents")}
                  icon={CalendarDays}
                  href="/events"
                  count={data.upcomingEventsCount}
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 ms-6">
                  {t("sitemap.noEvents")}
                </p>
              )}
              <TreeNode
                label={t("sitemap.pastEvents")}
                icon={CalendarDays}
                href="/events"
                count={data.stats.totalEvents - data.upcomingEventsCount}
              />
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {t("sitemap.helpText")}
        </p>
      </div>
    </div>
  );
}
