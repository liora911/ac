"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useGuest } from "@/hooks/useGuests";
import RichContent from "@/components/RichContent/RichContent";
import { getYouTubeThumbnailFromUrl } from "@/lib/utils/youtube";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
  Film,
  Images,
  Loader2,
} from "lucide-react";
import type { GuestWork } from "@/types/Guests/guests";

function workCover(work: GuestWork): string | null {
  return (
    work.coverImageUrl ||
    (work.imageUrls.length > 0 ? work.imageUrls[0] : null) ||
    getYouTubeThumbnailFromUrl(work.videoUrl)
  );
}

export default function GuestProfilePage() {
  const params = useParams<{ slug: string }>();
  const { t, locale } = useTranslation();
  const { data: guest, isLoading, isError } = useGuest(params?.slug);

  const BackArrow = locale === "he" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !guest) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {t("guests.notFound")}
        </p>
        <Link
          href="/guests"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <BackArrow className="w-4 h-4" />
          {t("guests.backToGuests")}
        </Link>
      </div>
    );
  }

  const works = guest.works ?? [];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Banner */}
      {guest.bannerImageUrl && (
        <div className="h-48 md:h-64 w-full overflow-hidden">
          <img
            src={guest.bannerImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 pb-14">
        {/* Profile header */}
        <div
          className={`flex flex-col items-center text-center ${
            guest.bannerImageUrl ? "-mt-14" : "pt-10"
          }`}
        >
          {guest.photoUrl ? (
            <img
              src={guest.photoUrl}
              alt={guest.name}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-lg"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white dark:ring-gray-900 shadow-lg">
              {guest.name.charAt(0)}
            </div>
          )}
          <h1
            dir={guest.titleDirection}
            className="mt-4 text-3xl font-bold text-[var(--foreground)]"
          >
            {guest.name}
          </h1>
          {guest.headline && (
            <p
              dir={guest.titleDirection}
              className="mt-2 text-gray-600 dark:text-gray-300"
            >
              {guest.headline}
            </p>
          )}
          {guest.websiteUrl && (
            <a
              href={guest.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              {t("guests.visitWebsite")}
            </a>
          )}
        </div>

        {/* Bio */}
        {guest.bio && (
          <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm">
            <RichContent
              content={guest.bio}
              className="text-gray-700 dark:text-gray-200"
            />
          </div>
        )}

        {/* Works */}
        <h2 className="mt-12 mb-5 text-2xl font-bold text-[var(--foreground)]">
          {t("guests.worksTitle")}
        </h2>
        {works.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
            {t("guests.noWorks")}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {works.map((work) => {
              const cover = workCover(work);
              return (
                <Link
                  key={work.id}
                  href={`/guests/${guest.slug || guest.id}/${work.id}`}
                  className="group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                >
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {cover ? (
                      <img
                        src={cover}
                        alt={work.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
                        {work.pdfUrl ? (
                          <FileText className="w-12 h-12" />
                        ) : work.videoUrl ? (
                          <Film className="w-12 h-12" />
                        ) : (
                          <Images className="w-12 h-12" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3
                      dir={work.titleDirection}
                      className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    >
                      {work.title}
                    </h3>
                    {work.description && (
                      <p
                        dir={work.titleDirection}
                        className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                      >
                        {work.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/guests"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <BackArrow className="w-4 h-4" />
            {t("guests.backToGuests")}
          </Link>
        </div>
      </div>
    </div>
  );
}
