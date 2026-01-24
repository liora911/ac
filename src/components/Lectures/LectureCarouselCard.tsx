"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lecture } from "@/types/Lectures/lectures";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useSession } from "next-auth/react";
import { Clock, Play, Lock } from "lucide-react";
import PremiumBadge from "@/components/PremiumBadge";
import FavoriteButton from "@/components/FavoriteButton";
import { LecturePlaceholder } from "@/components/Placeholders";
import { getYouTubeVideoId, getYouTubeThumbnail } from "@/lib/utils/youtube";

interface LectureCarouselCardProps {
  lecture: Lecture;
  onPlay?: (lecture: Lecture) => void;
}

/**
 * Compact lecture card designed for horizontal carousels.
 * Fixed width, optimized for scrolling display.
 */
export default function LectureCarouselCard({
  lecture,
  onPlay,
}: LectureCarouselCardProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [isHovered, setIsHovered] = useState(false);

  const hasAccess =
    !lecture.isPremium ||
    session?.user?.role === "ADMIN" ||
    session?.user?.hasActiveSubscription;

  const youtubeId = getYouTubeVideoId(lecture.videoUrl);
  const thumbnailUrl =
    lecture.bannerImageUrl || (youtubeId ? getYouTubeThumbnail(youtubeId) : null);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasAccess && onPlay) {
      onPlay(lecture);
    }
  };

  return (
    <div
      className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/lectures/${lecture.id}`}
        className={`block bg-white dark:bg-gray-800 rounded-xl overflow-hidden border transition-all duration-300 ${
          hasAccess
            ? "border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-1"
            : "border-gray-200 dark:border-gray-700 cursor-default"
        }`}
        onClick={(e) => !hasAccess && e.preventDefault()}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-900">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={lecture.title}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                hasAccess && isHovered ? "scale-110" : "scale-100"
              } ${!hasAccess ? "grayscale-[40%] brightness-75" : ""}`}
            />
          ) : (
            <LecturePlaceholder
              id={lecture.id}
              className={`w-full h-full ${!hasAccess ? "grayscale-[40%]" : ""}`}
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Duration badge */}
          <div className="absolute bottom-2 start-2 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-white text-xs">
            <Clock className="w-3 h-3" />
            <span>{lecture.duration} {t("lecturesPage.min")}</span>
          </div>

          {/* Premium badge */}
          {lecture.isPremium && (
            <div className="absolute top-2 start-2">
              <PremiumBadge size="sm" />
            </div>
          )}

          {/* Favorite button */}
          <div className="absolute top-2 end-2 z-10">
            <FavoriteButton itemId={lecture.id} itemType="LECTURE" size="sm" />
          </div>

          {/* Play button overlay */}
          {hasAccess ? (
            <button
              onClick={handlePlayClick}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 cursor-pointer ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-white fill-white ms-0.5" />
              </div>
            </button>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-14 h-14 rounded-full bg-gray-800/80 flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3
            className={`font-semibold line-clamp-2 mb-1 transition-colors ${
              hasAccess
                ? "text-gray-900 dark:text-white group-hover:text-blue-600"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {lecture.title}
          </h3>
          {lecture.description && (
            <p
              className={`text-sm line-clamp-2 ${
                hasAccess
                  ? "text-gray-600 dark:text-gray-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {lecture.description.replace(/<[^>]*>?/gm, "")}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
