"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useLecture } from "@/hooks/useLectures";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import RichContent from "@/components/RichContent";
import PremiumGate from "@/components/PremiumGate/PremiumGate";
import { Sparkles, Share2 } from "lucide-react";
import { track } from "@vercel/analytics";
import FavoriteButton from "@/components/FavoriteButton";
import { useNotification } from "@/contexts/NotificationContext";

export default function LectureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const lectureId = params.id as string;
  const { t, locale } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const { data: lecture, isLoading, error } = useLecture(lectureId);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showSuccess(t("lectureDetail.linkCopied"));
    } catch {
      showError(t("lectureDetail.copyError"));
    }
  };
  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  // Track lecture view
  useEffect(() => {
    if (lecture) {
      track("lecture_viewed", {
        lectureId: lecture.id,
        title: lecture.title,
        isPremium: lecture.isPremium ?? false,
      });
    }
  }, [lecture]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("lectureDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            {t("lectureDetail.errorTitle")}
          </div>
          <p className="text-gray-600 mb-4">
            {error.message || t("lectureDetail.errorGeneric")}
          </p>
          <button
            onClick={() => router.push("/lectures")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {t("lectureDetail.backToLectures")}
          </button>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg font-semibold mb-2">
            {t("lectureDetail.notFoundTitle")}
          </div>
          <p className="text-gray-600 mb-4">
            {t("lectureDetail.notFoundMessage")}
          </p>
          <button
            onClick={() => router.push("/lectures")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {t("lectureDetail.backToLectures")}
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      dateLocale as Intl.LocalesArgument,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {lecture.bannerImageUrl && (
        <div className="absolute inset-0 z-0">
          <Image
            src={lecture.bannerImageUrl}
            alt={lecture.title}
            fill
            className="object-cover opacity-50"
            priority
          />
        </div>
      )}

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <header className="mb-8">
          {lecture.isPremium && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Sparkles className="w-3 h-3" />
                {t("lectureDetail.premium") || "Premium"}
              </span>
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {lecture.title}
          </h1>

          <div className="flex items-center justify-between border-b border-gray-200 pb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {lecture.author?.image && (
                  <Image
                    src={lecture.author.image}
                    alt={lecture.author.name || "Author"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {lecture.author?.name || ""}
                  </p>
                  {lecture.date && (
                    <p className="text-sm text-gray-900">
                      {formatDate(lecture.date)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-900">
                {t("lectureDetail.duration")}: {lecture.duration}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  title={t("common.share")}
                >
                  <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <FavoriteButton itemId={lectureId} itemType="LECTURE" size="md" />
              </div>
            </div>
          </div>
        </header>

        <PremiumGate isPremium={lecture.isPremium ?? false}>
          {lecture.videoUrl && (
            <div className="mb-8">
              <iframe
                src={lecture.videoUrl}
                title={lecture.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg w-full h-[600px] shadow-lg"
              ></iframe>
            </div>
          )}

          <div dir={locale === "en" ? "ltr" : "rtl"}>
            <RichContent content={lecture.description} className="text-gray-800" />
          </div>
        </PremiumGate>

        <footer className="mt-12 pt-8 border-t border-gray-200"></footer>
      </article>
    </div>
  );
}
