"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  FileText,
  Video,
  Presentation,
  Clock,
  Crown,
  Trash2,
} from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useFavoritesFull, useRemoveFavorite } from "@/hooks/useFavorites";
import { FavoriteButton } from "@/components/FavoriteButton";
import { LecturePlaceholder, PresentationPlaceholder } from "@/components/Placeholders";
import { stripHtml } from "@/lib/utils/stripHtml";
import { getYouTubeVideoId, getYouTubeThumbnail } from "@/lib/utils/youtube";

const tabs: { id: TabType; icon: React.ElementType; labelKey: string }[] = [
  { id: "articles", icon: FileText, labelKey: "favorites.tabs.articles" },
  { id: "lectures", icon: Video, labelKey: "favorites.tabs.lectures" },
  {
    id: "presentations",
    icon: Presentation,
    labelKey: "favorites.tabs.presentations",
  },
];

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { data: favorites, isLoading, error } = useFavoritesFull();
  const [activeTab, setActiveTab] = useState<TabType>("articles");

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (status === "loading" || isLoading) {
    return (
      <div
        className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
        style={{ direction: locale === "he" ? "rtl" : "ltr" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-48 mb-8" />
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg w-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-gray-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
        style={{ direction: locale === "he" ? "rtl" : "ltr" }}
      >
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className="text-red-500">{t("favorites.errorLoading")}</p>
        </div>
      </div>
    );
  }

  const totalCount = favorites?.counts?.total ?? 0;
  const currentItems = favorites?.[activeTab] ?? [];

  return (
    <div
      className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t("favorites.title")}
            </h1>
          </div>
          <p className="text-gray-600">
            {t("favorites.subtitle").replace("{count}", String(totalCount))}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = favorites?.counts?.[tab.id] ?? 0;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium
                  transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }
                `}
              >
                <Icon size={18} />
                <span>{t(tab.labelKey)}</span>
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }
                  `}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentItems.length === 0 ? (
              <EmptyState type={activeTab} t={t} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === "articles" &&
                  favorites?.articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      locale={locale}
                      t={t}
                    />
                  ))}
                {activeTab === "lectures" &&
                  favorites?.lectures.map((lecture) => (
                    <LectureCard
                      key={lecture.id}
                      lecture={lecture}
                      locale={locale}
                      t={t}
                    />
                  ))}
                {activeTab === "presentations" &&
                  favorites?.presentations.map((presentation) => (
                    <PresentationCard
                      key={presentation.id}
                      presentation={presentation}
                      locale={locale}
                      t={t}
                    />
                  ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({
  type,
  t,
}: {
  type: TabType;
  t: (key: string) => string;
}) {
  const linkMap = {
    articles: "/articles",
    lectures: "/lectures",
    presentations: "/presentations",
  };

  return (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
      <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {t(`favorites.empty.${type}.title`)}
      </h3>
      <p className="text-gray-500 mb-6">
        {t(`favorites.empty.${type}.description`)}
      </p>
      <Link
        href={linkMap[type]}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {t(`favorites.empty.${type}.cta`)}
      </Link>
    </div>
  );
}

// Article card component
function ArticleCard({
  article,
  locale,
  t,
}: {
  article: {
    id: string;
    slug?: string | null;
    title: string;
    articleImage?: string | null;
    publisherName: string;
    readDuration: number;
    isPremium: boolean;
    createdAt: string;
    category?: { id: string; name: string } | null;
    authors?: Array<{ id: string; name: string; imageUrl?: string | null }>;
  };
  locale: string;
  t: (key: string) => string;
}) {
  return (
    <Link href={`/articles/${article.slug || article.id}`}>
      <motion.div
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group h-full"
        whileHover={{ y: -4 }}
      >
        <div className="relative h-40">
          {article.articleImage ? (
            <img
              src={article.articleImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="w-12 h-12 text-white/50" />
            </div>
          )}
          <div className="absolute top-3 end-3">
            <FavoriteButton itemId={article.id} itemType="ARTICLE" size="sm" />
          </div>
          {article.isPremium && (
            <div className="absolute top-3 start-3 bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
              <Crown size={12} />
              {t("common.premium")}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {article.category && (
              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                {article.category.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {article.readDuration} {t("common.minRead")}
            </span>
          </div>
          {article.authors && article.authors.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {article.authors.map((a) => a.name).join(", ")}
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

// Lecture card component
function LectureCard({
  lecture,
  locale,
  t,
}: {
  lecture: {
    id: string;
    title: string;
    description: string;
    bannerImageUrl?: string | null;
    videoUrl?: string | null;
    duration: string;
    isPremium: boolean;
    createdAt: string;
    category: { id: string; name: string };
  };
  locale: string;
  t: (key: string) => string;
}) {
  // Priority: 1. Banner image, 2. YouTube thumbnail, 3. Placeholder
  const youtubeId = getYouTubeVideoId(lecture.videoUrl);
  const thumbnailUrl = lecture.bannerImageUrl || (youtubeId ? getYouTubeThumbnail(youtubeId) : null);

  return (
    <Link href={`/lectures/${lecture.id}`}>
      <motion.div
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group h-full"
        whileHover={{ y: -4 }}
      >
        <div className="relative h-40 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={lecture.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <LecturePlaceholder id={lecture.id} />
          )}
          <div className="absolute top-3 end-3">
            <FavoriteButton itemId={lecture.id} itemType="LECTURE" size="sm" />
          </div>
          {lecture.isPremium && (
            <div className="absolute top-3 start-3 bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
              <Crown size={12} />
              {t("common.premium")}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {lecture.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {stripHtml(lecture.description)}
          </p>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
              {lecture.category.name}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {lecture.duration}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Presentation card component
function PresentationCard({
  presentation,
  locale,
  t,
}: {
  presentation: {
    id: string;
    title: string;
    description: string;
    imageUrls: string[];
    isPremium: boolean;
    createdAt: string;
    category: { id: string; name: string };
  };
  locale: string;
  t: (key: string) => string;
}) {
  const thumbnailUrl = presentation.imageUrls?.[0];

  return (
    <Link href={`/presentations/${presentation.id}`}>
      <motion.div
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group h-full"
        whileHover={{ y: -4 }}
      >
        <div className="relative h-40 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={presentation.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <PresentationPlaceholder id={presentation.id} />
          )}
          <div className="absolute top-3 end-3">
            <FavoriteButton
              itemId={presentation.id}
              itemType="PRESENTATION"
              size="sm"
            />
          </div>
          {presentation.isPremium && (
            <div className="absolute top-3 start-3 bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
              <Crown size={12} />
              {t("common.premium")}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {presentation.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {stripHtml(presentation.description)}
          </p>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
              {presentation.category.name}
            </span>
            <span className="text-xs text-gray-400">
              {presentation.imageUrls.length} {t("common.slides")}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
