"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/contexts/Translation/translation.context";
import PremiumBadge from "@/components/PremiumBadge";
import type { ContentItem, MixedCarouselSectionProps } from "@/types/Home/home";
import { stripHtml } from "@/lib/utils/stripHtml";

function getItemLink(item: ContentItem): string {
  switch (item._contentType) {
    case "article":
      return `/articles/${item.slug || item.id}`;
    case "lecture":
      return `/lectures/${item.id}`;
    case "presentation":
      return `/presentations/${item.id}`;
    default:
      return "#";
  }
}

function getTypeBadgeColor(type?: string): string {
  switch (type) {
    case "article":
      return "bg-blue-600";
    case "lecture":
      return "bg-purple-600";
    case "presentation":
      return "bg-emerald-600";
    default:
      return "bg-gray-600";
  }
}

const MixedCarouselSection: React.FC<MixedCarouselSectionProps> = ({
  title,
  items,
  getImageUrl,
  getSubtitle,
}) => {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2>
      </div>

      {/* Mobile: Horizontal scroll */}
      <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
        <div className="flex gap-4" style={{ width: "max-content" }}>
          {items.map((item) => (
            <MixedCard
              key={item.id}
              item={item}
              getImageUrl={getImageUrl}
              getSubtitle={getSubtitle}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <MixedCard
            key={item.id}
            item={item}
            getImageUrl={getImageUrl}
            getSubtitle={getSubtitle}
            t={t}
          />
        ))}
      </div>
    </div>
  );
};

function MixedCard({
  item,
  getImageUrl,
  getSubtitle,
  t,
}: {
  item: ContentItem;
  getImageUrl: (item: ContentItem) => string | null;
  getSubtitle?: (item: ContentItem) => string | null;
  t: (key: string) => string;
}) {
  const imageUrl = getImageUrl(item);
  const rawSubtitle = getSubtitle?.(item);
  const subtitle = rawSubtitle ? stripHtml(rawSubtitle) : null;
  const itemLink = getItemLink(item);
  const typeLabel = item._contentType
    ? t(`home.sections.${item._contentType}`)
    : "";

  return (
    <Link
      href={itemLink}
      className="block group/card flex-shrink-0 w-72 sm:w-auto"
    >
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-md hover:shadow-xl transition-shadow duration-300">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            sizes="(max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Content type badge - top left */}
        <div className="absolute top-3 left-3">
          <span
            className={`${getTypeBadgeColor(item._contentType)} text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg`}
          >
            {typeLabel}
          </span>
        </div>

        {/* Premium badge - top right */}
        {item.isPremium && (
          <div className="absolute top-3 right-3">
            <PremiumBadge size="sm" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg line-clamp-2 drop-shadow-lg">
            {item.title}
          </h3>
          {subtitle && (
            <p className="text-white/80 text-sm mt-1 line-clamp-1 drop-shadow-md">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default MixedCarouselSection;
