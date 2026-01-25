"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Share2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNotification } from "@/contexts/NotificationContext";
import type { MobileArticleCardProps } from "@/types/Articles/articles";
import FavoriteButton from "@/components/FavoriteButton";
import PremiumBadge from "@/components/PremiumBadge";
import AuthorAvatars from "./AuthorAvatars";
import { DEFAULT_ARTICLE_IMAGE } from "@/constants/images";
import { copyToClipboard } from "@/lib/utils/clipboard";

export default function MobileArticleCard({ article }: MobileArticleCardProps) {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const { showSuccess } = useNotification();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  // Check if user has premium access
  const hasAccess =
    !article.isPremium ||
    session?.user?.role === "ADMIN" ||
    session?.user?.hasActiveSubscription;

  const displayImage = article.featuredImage || DEFAULT_ARTICLE_IMAGE;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/articles/${article.slug || article.id}`;
    await copyToClipboard(url);
    showSuccess(t("articleDetail.linkCopied"));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Link
      href={`/articles/${article.slug || article.id}`}
      className="block group"
    >
      <article
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 transition-all relative ${
          hasAccess
            ? "hover:border-blue-300 dark:hover:border-blue-600 active:bg-gray-50 dark:active:bg-gray-700"
            : ""
        }`}
      >
        {/* Overlay for non-accessible premium content */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-[1px] z-[5] rounded-lg pointer-events-none" />
        )}

        <div className="flex gap-3">
          {/* Thumbnail */}
          <div
            className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden ${
              !hasAccess ? "grayscale-[30%]" : ""
            }`}
          >
            <Image
              src={displayImage}
              alt={article.title}
              fill
              className="object-cover"
              sizes="80px"
            />

            {/* Featured star overlay */}
            {article.isFeatured && (
              <div className="absolute top-1 left-1 bg-yellow-500 p-1 rounded-full">
                <Star className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Title row with premium badge */}
            <div className="flex items-start gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                {article.title}
              </h3>
              {article.isPremium && <PremiumBadge size="sm" />}
            </div>

            {/* Subtitle */}
            {article.subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">
                {article.subtitle}
              </p>
            )}

            {/* Meta row */}
            <div className="mt-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {/* Author */}
              {article.authors && article.authors.length > 0 ? (
                <AuthorAvatars authors={article.authors} size="sm" />
              ) : (
                <span className="truncate max-w-[60px]">
                  {article.publisherName || article.author?.name}
                </span>
              )}

              <span>•</span>
              <span>{formatDate(article.createdAt)}</span>
              <span>•</span>
              <span>
                {article.readTime} {t("articleCard.minRead")}
              </span>

              {/* Category badge */}
              {(article.categories?.[0] || article.category) && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400 truncate max-w-[60px]">
                    {article.categories?.[0]?.name || article.category?.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions column */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <FavoriteButton itemId={article.id} itemType="ARTICLE" size="sm" />
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t("articleDetail.share")}
            >
              <Share2 className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
